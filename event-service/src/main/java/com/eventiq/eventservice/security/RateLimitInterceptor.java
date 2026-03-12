package com.eventiq.eventservice.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowSeconds;

    public RateLimitInterceptor(
            @Value("${app.rate-limit.max-requests:120}") int maxRequests,
            @Value("${app.rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        if (path.contains("/health") || path.startsWith("/actuator") || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String key = request.getRemoteAddr();
        long now = Instant.now().getEpochSecond();

        WindowCounter counter = counters.compute(key, (_k, existing) -> {
            if (existing == null || now - existing.windowStart >= windowSeconds) {
                return new WindowCounter(now, new AtomicInteger(1));
            }
            existing.requestCount.incrementAndGet();
            return existing;
        });

        if (counter.requestCount.get() > maxRequests) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests\"}");
            return false;
        }

        return true;
    }

    private static class WindowCounter {
        private final long windowStart;
        private final AtomicInteger requestCount;

        private WindowCounter(long windowStart, AtomicInteger requestCount) {
            this.windowStart = windowStart;
            this.requestCount = requestCount;
        }
    }
}
