# Geenerate README.md from project files
bunx globflow *.{ts,json,sh} --md -m "Given the file list, write a README.md for this project, dont explain just give me md" |bunx gptflow | tee README.md

# Optimze README.md from project files
bunx globflow@0.0.2 *.{ts,json,sh,md} --md -m "Given the file list, optimize the README.md for this project, dont explain just give me md" |bunx gptflow@0.0.4 | tee README.md

# generate description
prompt="Give me a optimized description value for package.json, don't write explains, just send me a sentence"
description=$(bunx globflow@0.0.2 *.{ts,json,sh,md} --md -m "$prompt" |bunx gptflow@0.0.4)
echo $description
npm pkg set description="$description"
