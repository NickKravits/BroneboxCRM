#!/bin/bash
# Проставляет ?v=<git-хэш> у локальных styles.css/style.css/app-shell.css/app-shell.js
# во всех index.html проекта. Благодаря этому при каждом деплое у CSS/JS меняется URL,
# и браузер каждого пользователя гарантированно скачивает свежую версию, а не берёт
# из кэша — без каких-либо действий с их стороны.
#
# Также пишет crm/version.json — его на лету опрашивает баннер обновления в app-shell.js,
# чтобы предлагать обновиться даже тем, у кого страница/WebApp просто "зависла" открытой
# и никакого нового запроса вообще не делает (частый случай на iOS с сайтом на "Домой").
#
# Запускается вручную (bash bump-version.sh) или автоматически хуком .githooks/post-merge
# после каждого git pull (см. README.md — как включить хук один раз на сервере).
set -e
cd "$(dirname "$0")"

VERSION=$(git rev-parse --short HEAD)

CHANGED=0
while IFS= read -r -d '' file; do
  before=$(cat "$file")
  sed -i -E \
    -e "s/(href=\"(style|styles|app-shell)\.css)(\?v=[a-f0-9]+)?\"/\1?v=${VERSION}\"/g" \
    -e "s/(src=\"app-shell\.js)(\?v=[a-f0-9]+)?\"/\1?v=${VERSION}\"/g" \
    "$file"
  after=$(cat "$file")
  if [ "$before" != "$after" ]; then
    CHANGED=$((CHANGED + 1))
  fi
done < <(find . -path ./.git -prune -o -name "index.html" -print0)

echo "{\"version\":\"${VERSION}\"}" > crm/version.json

echo "Версия статики: ${VERSION} (обновлено файлов: ${CHANGED})"
