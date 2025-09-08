cat ./README.md > ./llms-full.md
echo "----" >> ./llms-full.md
echo "# Example Code" >> ./llms-full.md
echo "This is a basic example code for CodeChopper. This example extracts the definitions of functions, variables, classes, etc. across the entire project, in a format similar to Aider's repomap or ctags." >> ./llms-full.md
echo "\`\`\`typecript" >> ./llms-full.md
curl -s https://raw.githubusercontent.com/sirasagi62/code-chopper-examples/refs/heads/main/src/repo_summary.ts >> ./llms-full.md
echo "\`\`\`" >> ./llms-full.md
echo "✨️ Completed to build llms-full.md"

