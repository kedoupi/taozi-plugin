---
name: docker-patterns
description: Docker 和 Docker Compose 模式 — 镜像构建、网络、卷挂载、多阶段构建、容器安全。
---

# Docker 和 Docker Compose 模式参考

容器化开发与部署的最佳实践。

## 多阶段构建

```dockerfile
# ---- 构建阶段 ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ---- 生产阶段 ----
FROM node:20-alpine AS runner
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

Go 多阶段构建示例:

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /server .

FROM scratch
COPY --from=builder /server /server
ENTRYPOINT ["/server"]
```

## .dockerignore

```
.git
node_modules
dist
*.md
.env
.env.local
coverage
.vscode
Dockerfile*
docker-compose*
```

## Docker Compose 服务编排

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/myapp
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

## 网络模式

```
bridge   - 默认模式，容器间通过服务名通信 (推荐)
host     - 直接使用宿主机网络，无端口映射 (性能敏感场景)
overlay  - 多主机 Swarm 通信 (集群部署)
none     - 无网络 (批处理任务)
```

```yaml
# 自定义网络
services:
  app:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend  # db 只在 backend 网络，app 可访问

networks:
  frontend:
  backend:
    internal: true  # 无法访问外网
```

## 卷挂载策略

```yaml
volumes:
  # 命名卷 - 数据持久化 (数据库、文件上传)
  - pgdata:/var/lib/postgresql/data

  # 绑定挂载 - 开发时代码热重载
  - ./src:/app/src

  # 只读挂载 - 配置文件
  - ./config:/app/config:ro

  # tmpfs - 临时数据 (会话、缓存)
  - type: tmpfs
    target: /tmp
```

## 镜像安全

```dockerfile
# 1. 使用最小基础镜像
FROM alpine:3.19      # ~5MB
FROM scratch           # 0MB (静态编译的 Go)
FROM gcr.io/distroless/static  # Google 无 shell 镜像

# 2. 非 root 用户运行
RUN adduser -D appuser
USER appuser

# 3. 固定版本标签，不用 latest
FROM node:20.11-alpine  # 不用 node:latest

# 4. 不在镜像中存储密钥
# 用环境变量或 Docker secrets 传入

# 5. 最小化层数
RUN apk add --no-cache curl && \
    curl -sL https://example.com/tool | tar xz && \
    apk del curl
```

## 环境变量管理

```yaml
# docker-compose.yml - 开发环境默认值
services:
  app:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    env_file:
      - .env.local  # 敏感值不提交到 Git

# docker-compose.prod.yml - 生产覆盖
services:
  app:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
```

## 日志收集

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
        tag: "{{.Name}}"
```

输出到 stdout/stderr (十二要素应用原则)，日志收集器 (Fluentd/Filebeat) 统一处理。
