package com.aiframework.config;

import com.webauthn4j.data.client.Origin;
import com.webauthn4j.data.client.challenge.Challenge;
import com.webauthn4j.data.client.challenge.DefaultChallenge;
import com.webauthn4j.server.ServerProperty;
import com.webauthn4j.springframework.security.authenticator.WebAuthnAuthenticatorManager;
import com.webauthn4j.springframework.security.authenticator.WebAuthnAuthenticator;
import com.webauthn4j.springframework.security.config.configurers.WebAuthnLoginConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import com.webauthn4j.springframework.security.authenticator.InMemoryWebAuthnAuthenticatorManager;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public WebAuthnAuthenticatorManager webAuthnAuthenticatorManager() {
        return new InMemoryWebAuthnAuthenticatorManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable())
            .with(WebAuthnLoginConfigurer.webAuthnLogin(), webAuthnLogin -> {
                webAuthnLogin
                    .loginPage("/login")
                    .usernameParameter("username")
                    .passwordParameter("password")
                    .credentialIdParameter("credentialId")
                    .clientDataJSONParameter("clientDataJSON")
                    .authenticatorDataParameter("authenticatorData")
                    .signatureParameter("signature")
                    .clientExtensionsJSONParameter("clientExtensionsJSON")
                    .successHandler((request, response, authentication) -> {
                        response.setStatus(200);
                    })
                    .failureHandler((request, response, exception) -> {
                        response.setStatus(401);
                    });
            });

        return http.build();
    }
}
