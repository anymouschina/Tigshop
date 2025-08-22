const fs = require('fs');
const path = require('path');

// 增强版下划线转驼峰
function snakeToCamel(str) {
    return str.replace(/([-_][a-z0-9])/g, (group) => 
        group.toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
}

// 增强版驼峰转下划线
function camelToSnake(str) {
    return str.replace(/([A-Z0-9])/g, (letter) => `_${letter.toLowerCase()}`)
             .replace(/^_/, ''); // 防止开头出现下划线
}

// 更精准的接口键名转换
function convertFile(filePath, mode = 'snakeToCamel') {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 增强版正则匹配：
    // 1. 支持复杂类型（如 string[]、TypeName）
    // 2. 支持可选属性（key?: type）
    // 3. 支持联合类型（type1 | type2）
    const convertedContent = content.replace(
        /(interface\s+\w+\s*\{[\s\S]*?\})/g,
        (interfaceBlock) => {
            return interfaceBlock.replace(
                /(\s+)(\w+)(\??\s*:\s*(?:[^{};]|{[^}]*}|$[^)]*$|[A-Z]\w*(?:$[^$]*\])?|[A-Z]\w*<[^>]*>|\w+\s*\|\s*\w+)\s*[;,]?)/g,
                (_, indent, key, rest) => {
                    const newKey = mode === 'snakeToCamel' ? snakeToCamel(key) : camelToSnake(key);
                    return `${indent}${newKey}${rest}`;
                }
            );
        }
    );

    fs.writeFileSync(filePath, convertedContent, 'utf-8');
    console.log(`✅ ${filePath} 转换完成！`);
}

// 使用方式：
// node convert-interface-keys.js ./src/types.ts snakeToCamel
const [filePath, mode = 'snakeToCamel'] = process.argv.slice(2);
if (!filePath) {
    console.error('请指定文件路径，如：node convert-interface-keys.js ./src/types.ts');
    process.exit(1);
}
convertFile(filePath, mode);