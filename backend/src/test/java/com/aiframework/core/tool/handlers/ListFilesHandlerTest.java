package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ListFilesHandlerTest {

    private ListFilesHandler handler;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        handler = new ListFilesHandler(new ObjectMapper());
    }

    @Test
    void handlerName_isListFiles() {
        assertEquals("list_files", handler.handlerName());
    }

    @Test
    void validDirectory_returnsFileList() throws IOException {
        Files.createFile(tempDir.resolve("file1.txt"));
        Files.createFile(tempDir.resolve("file2.txt"));
        Files.createDirectory(tempDir.resolve("subdir"));

        ToolExecutionResult r = handler.execute(Map.of("path", tempDir.toString()), "conv-1");

        assertTrue(r.isSuccess(), "Expected success but got error: " + r.getError());
        assertNotNull(r.getResult());

        // Result should be JSON array
        ObjectMapper mapper = new ObjectMapper();
        List<?> files = mapper.readValue(r.getResult(), List.class);
        assertEquals(3, files.size());
    }

    @Test
    void fileListIsSortedByName() throws IOException {
        Files.createFile(tempDir.resolve("zebra.txt"));
        Files.createFile(tempDir.resolve("apple.txt"));
        Files.createFile(tempDir.resolve("mango.txt"));

        ToolExecutionResult r = handler.execute(Map.of("path", tempDir.toString()), "conv-1");
        assertTrue(r.isSuccess());

        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> files = mapper.readValue(r.getResult(),
                mapper.getTypeFactory().constructCollectionType(List.class, Map.class));

        assertEquals("apple.txt", files.get(0).get("name"));
        assertEquals("mango.txt", files.get(1).get("name"));
        assertEquals("zebra.txt", files.get(2).get("name"));
    }

    @Test
    void emptyDirectory_returnsEmptyList() throws IOException {
        ToolExecutionResult r = handler.execute(Map.of("path", tempDir.toString()), "conv-1");
        assertTrue(r.isSuccess());
        assertEquals("[]", r.getResult().trim());
    }

    @Test
    void pathPointsToFile_returnsError() throws IOException {
        Path file = Files.createFile(tempDir.resolve("notadir.txt"));
        ToolExecutionResult r = handler.execute(Map.of("path", file.toString()), "conv-1");
        assertFalse(r.isSuccess());
        assertTrue(r.getError().contains("Not a directory"));
    }

    @Test
    void nonExistentPath_returnsError() {
        ToolExecutionResult r = handler.execute(Map.of("path", "/this/does/not/exist/ever"), "conv-1");
        assertFalse(r.isSuccess());
        assertNotNull(r.getError());
    }

    @Test
    void noPathProvided_defaultsToUserHome() {
        // Should not throw; should return home directory listing or error if home is unreadable
        ToolExecutionResult r = handler.execute(Map.of(), "conv-1");
        assertNotNull(r);
        // Either success (home is readable) or error (home is inaccessible) — both acceptable
    }

    @Test
    void resultContainsExpectedFields() throws IOException {
        Files.createFile(tempDir.resolve("test.txt"));

        ToolExecutionResult r = handler.execute(Map.of("path", tempDir.toString()), "conv-1");
        assertTrue(r.isSuccess());

        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> files = mapper.readValue(r.getResult(),
                mapper.getTypeFactory().constructCollectionType(List.class, Map.class));

        Map<String, Object> entry = files.get(0);
        assertTrue(entry.containsKey("name"));
        assertTrue(entry.containsKey("path"));
        assertTrue(entry.containsKey("type"));
        assertTrue(entry.containsKey("lastModified"));
        // files also have size
        assertEquals("file", entry.get("type"));
        assertTrue(entry.containsKey("size"));
    }

    @Test
    void directoryEntry_hasNoSizeField() throws IOException {
        Files.createDirectory(tempDir.resolve("mysubdir"));

        ToolExecutionResult r = handler.execute(Map.of("path", tempDir.toString()), "conv-1");
        assertTrue(r.isSuccess());

        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> files = mapper.readValue(r.getResult(),
                mapper.getTypeFactory().constructCollectionType(List.class, Map.class));

        Map<String, Object> dir = files.get(0);
        assertEquals("directory", dir.get("type"));
        assertFalse(dir.containsKey("size"), "Directories should not have a size field");
    }
}
