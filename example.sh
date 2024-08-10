bunx globflow *.{ts,json,sh} --md -m "Given the file list, write a README.md for this project, dont explain just give me md" |bunx gptflow | tee README.md

bunx globflow@0.0.2 *.{ts,json,sh,md} --md -m "Given the file list, optimize the README.md for this project, dont explain just give me md" |bunx gptflow@0.0.4 | tee README.md