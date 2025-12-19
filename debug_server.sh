#!/bin/bash

# 1. Start clean: Reset test state
echo "--- RESETTING TEST STATE ---"
curl -X POST https://server.haroo.site/test-tools/reset
echo -e "\n"

# 2. Login as Initiator (User A)
# Depending on your auth implementation, you might need a valid token.
# Assuming we can use a known test account or bypass content.
# Since we don't have easy login script, we'll assume we can skip auth if we disable it temporarily OR
# Easier: Use the app? No, app failed.
# Let's try to verify if ANY requests are hitting the server logs.

# Wait.. if nodemon output shows NO requests, then the App is not hitting https://server.haroo.site.
# The App is running on Android Emulator?
# Android Emulator 10.0.2.2 -> localhost.
# If the app is configured to hit a different IP or port, that explains it.

# Let's verify server is actually reachable first.
echo "--- CHECKING SERVER STATUS ---"
curl https://server.haroo.site/test-tools/status
echo -e "\n"
