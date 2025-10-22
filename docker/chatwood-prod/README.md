### Prepare

```bash
docker compose run --rm rails bundle exec rails db:chatwoot_prepare
```

### Run

```bash
docker compose up -d
```

### Copy application.rb

```bash
docker cp chatwood-prod-rails-1:/app/config/application.rb ./config/application.rb
## copiar vite.config.js
docker cp chatwood-prod-rails-1:/app/config/vite.json ./config/vite.json
```
