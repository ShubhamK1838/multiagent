package com.aiframework.service.memory;

import com.aiframework.domain.entity.ConversationSummary;
import com.aiframework.domain.repository.ConversationSummaryRepository;
import com.aiframework.service.ConversationService;
import com.aiframework.service.SettingsService;
import com.aiframework.service.monitoring.LogStreamService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionMemoryService {

    private final ConversationSummaryRepository summaryRepository;
    private final ConversationService conversationService;
    private final SettingsService settingsService;
    private final LogStreamService logStreamService;
    private final ObjectMapper objectMapper;
    private final MemoryChatClient memoryChatClient;

    // Called after a successful AGENT_END — runs async on the orchestrator thread, not in a DB transaction.
    public void summarizeAndSave(UUID conversationId) {
        if (!settingsService.getBoolean("memory.enabled", true)) return;

        int minMessages = settingsService.getInt("memory.min_messages", 4);
        List<Message> history = conversationService.getHistory(conversationId);
        if (history.size() < minMessages) {
            log.debug("Skipping memory summarization for conv {} — only {} messages", conversationId, history.size());
            return;
        }

        logStreamService.agent("MEMORY", "✦ Summarizing conversation " + conversationId.toString().substring(0, 8));

        String summaryPrompt = settingsService.get("memory.summary_prompt",
                "Summarise this conversation in 3-5 sentences. Respond ONLY as JSON: {\"summary\":\"...\",\"key_paths\":[\"...\"],\"key_facts\":{}}");

        String rawResponse = memoryChatClient.chat(buildSummarizationMessages(summaryPrompt, history));
        if (rawResponse == null || rawResponse.isBlank()) {
            log.warn("Empty LLM response for memory summarization, skipping");
            return;
        }

        ConversationSummary summary = parseSummaryResponse(conversationId, rawResponse);
        persistSummary(summary);
        logStreamService.agent("MEMORY", "✓ Summary saved for conv " + conversationId.toString().substring(0, 8));
    }

    public String buildMemoryBlock() {
        if (!settingsService.getBoolean("memory.enabled", true)) return "";

        int maxSummaries = settingsService.getInt("memory.max_summaries", 5);
        List<ConversationSummary> summaries = summaryRepository.findByOrderByCreatedAtDesc(
                PageRequest.of(0, maxSummaries));

        if (summaries.isEmpty()) return "";

        StringBuilder block = new StringBuilder("## Past Session Memory\n\n");
        block.append("The following are summaries of your recent conversations. Use them to maintain continuity.\n\n");
        for (ConversationSummary s : summaries) {
            block.append("**Session (").append(s.getCreatedAt().toString().substring(0, 10)).append("):** ");
            block.append(s.getSummary()).append("\n");
            if (s.getKeyPaths() != null && !s.getKeyPaths().isEmpty()) {
                block.append("  - Paths: ").append(String.join(", ", s.getKeyPaths())).append("\n");
            }
        }
        return block.toString();
    }

    public List<ConversationSummary> listSummaries() {
        return summaryRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, 50));
    }

    public Optional<ConversationSummary> getSummary(UUID conversationId) {
        return summaryRepository.findByConversationId(conversationId);
    }

    @Transactional
    public int deleteAll() {
        List<ConversationSummary> all = summaryRepository.findAll();
        summaryRepository.deleteAll(all);
        return all.size();
    }

    private List<Message> buildSummarizationMessages(String summaryPrompt, List<Message> history) {
        String conversationText = history.stream()
                .map(m -> {
                    if (m instanceof UserMessage) return "User: " + m.getText();
                    return "Assistant: " + m.getText();
                })
                .collect(Collectors.joining("\n"));

        return List.of(
                new SystemMessage(summaryPrompt),
                new UserMessage("Conversation to summarize:\n\n" + conversationText)
        );
    }

    private ConversationSummary parseSummaryResponse(UUID conversationId, String raw) {
        String cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("```[a-z]*\\n?", "").replaceAll("```", "").trim();
        }

        try {
            Map<String, Object> parsed = objectMapper.readValue(cleaned, new TypeReference<>() {});
            String summary = (String) parsed.getOrDefault("summary", raw);
            Object rawPaths = parsed.get("key_paths");
            List<String> keyPaths = rawPaths instanceof List<?> list
                    ? list.stream().map(Object::toString).collect(Collectors.toList())
                    : Collections.emptyList();
            @SuppressWarnings("unchecked")
            Map<String, Object> keyFacts = parsed.get("key_facts") instanceof Map<?,?> m
                    ? (Map<String, Object>) m
                    : Collections.emptyMap();

            return ConversationSummary.builder()
                    .conversationId(conversationId)
                    .summary(summary)
                    .keyPaths(keyPaths)
                    .keyFacts(keyFacts)
                    .build();
        } catch (Exception e) {
            log.warn("Could not parse memory summary JSON for conv {}, saving raw text", conversationId);
            return ConversationSummary.builder()
                    .conversationId(conversationId)
                    .summary(raw)
                    .keyPaths(Collections.emptyList())
                    .keyFacts(Collections.emptyMap())
                    .build();
        }
    }

    @Transactional
    protected void persistSummary(ConversationSummary newSummary) {
        summaryRepository.findByConversationId(newSummary.getConversationId())
                .ifPresentOrElse(
                        existing -> {
                            existing.setSummary(newSummary.getSummary());
                            existing.setKeyPaths(newSummary.getKeyPaths());
                            existing.setKeyFacts(newSummary.getKeyFacts());
                            summaryRepository.save(existing);
                        },
                        () -> summaryRepository.save(newSummary)
                );
    }
}
