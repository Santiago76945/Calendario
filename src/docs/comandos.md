### Comandos

find src \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.json" -o -name "*.md" \) \
  ! -name "*.d.ts" \
  -type f \
  -print0 | xargs -0 cat > unificadoSRC.txt


find functions -name "*.cjs" -type f -print0 | xargs -0 cat > unificadoFunctions.txt



cat \
src/components/ejemplo-poner-archivoreal \
src/app/api/acaotroejemplo\
> losarchivosquetepedi.txt

cat \
src/components/RealtimeHelper.tsx \
src/components/realtime/useRealtimeController.ts \
src/components/realtime/realtimeEventHandler.ts \
src/components/realtime/realtimeRtc.ts \
src/components/realtime/realtimeServerApi.ts \
src/app/api/conversations/save/route.ts \
src/components/SavedConversations.tsx \
> realtime-helper-relevant.txt