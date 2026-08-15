#!/bin/bash
# Безопасный деплой вместо голого "git pull".
#
# Раньше bump-version.sh коммитил версию ПОСЛЕ pull — и если между деплоями
# версия менялась и на сервере, и в коммитах, которые прилетали следующим
# pull'ом, обе стороны трогали одни и те же строки ?v=... и постоянно
# конфликтовали. Здесь наоборот: перед pull сбрасываем предыдущий локальный
# бамп версии (он не несёт ценности сам по себе — это просто отметка, которая
# всё равно пересчитывается после каждого pull), поэтому конфликтовать не с чем.
#
# config.js НЕ трогаем — там боевые значения этого сервера, они должны
# оставаться незакоммиченными всегда.
set -e
cd "$(dirname "$0")"

git checkout -- '*index.html' crm/version.json 2>/dev/null || true

git pull --no-rebase --no-edit

bash bump-version.sh

if ! git diff --quiet -- '*index.html' crm/version.json; then
  git add -- '*index.html' crm/version.json
  git commit -m "chore: bump asset version" --quiet --no-verify
  echo "Версия закоммичена."
fi

echo "Деплой завершён."
