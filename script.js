
class HuffmanNode {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}


function buildFrequencyMap(str) {
    const freqMap = {}; 
    for (let char of str) {
        freqMap[char] = (freqMap[char] || 0) + 1;
    }
    return freqMap;
}


function buildHuffmanTree(freqMap) {
    const nodes = Object.entries(freqMap).map(([char, freq]) => new HuffmanNode(char, freq));
    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        const newNode = new HuffmanNode(null, left.freq + right.freq, left, right);
        nodes.push(newNode);
    }
    return nodes[0];
}


function generateHuffmanCodes(root, currentCode = "", codeMap = {}) {
    if (root === null) return;
    if (root.char !== null) {
        codeMap[root.char] = currentCode;
    }
    generateHuffmanCodes(root.left, currentCode + "0", codeMap);
    generateHuffmanCodes(root.right, currentCode + "1", codeMap);
    return codeMap;
}


function compressString(str, huffmanCodes) {
    let compressed = "";
    for (let char of str) {
        compressed += huffmanCodes[char];
    }
    return compressed;
}


function binaryToBase64(binaryStr) {
    const paddedBinaryStr = binaryStr.padEnd(Math.ceil(binaryStr.length / 8) * 8, '0');
    let binaryArray = [];
    for (let i = 0; i < paddedBinaryStr.length; i += 8) {
        const byte = paddedBinaryStr.substr(i, 8);
        binaryArray.push(parseInt(byte, 2));
    }
    const byteArray = new Uint8Array(binaryArray);
    return btoa(String.fromCharCode(...byteArray));
}


function serializeTree(node) {
    if (!node) return null;
    return {
        char: node.char,
        freq: node.freq,
        left: serializeTree(node.left),
        right: serializeTree(node.right)
    };
}


function deserializeTree(obj) {
    if (!obj) return null;
    return new HuffmanNode(obj.char, obj.freq, deserializeTree(obj.left), deserializeTree(obj.right));
}


document.getElementById('compressBtn').addEventListener('click', () => {
    const files = document.getElementById('fileInput').files;
    if (files.length === 0) {
        alert('Please select files to compress.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileContent = e.target.result;
        try {
            const freqMap = buildFrequencyMap(fileContent);
            const huffmanTree = buildHuffmanTree(freqMap);
            const huffmanCodes = generateHuffmanCodes(huffmanTree);
            const compressedContent = compressString(fileContent, huffmanCodes);
            const base64Encoded = binaryToBase64(compressedContent);

           
            const serializedTree = JSON.stringify(serializeTree(huffmanTree));
            localStorage.setItem('huffmanTree', serializedTree);

            
            const blob = base64ToBlob(base64Encoded, 'text/plain');
            const downloadLink = document.getElementById('downloadLink');
            const url = URL.createObjectURL(blob);

            downloadLink.href = url;
            downloadLink.download = 'compressed_file.txt';
            downloadLink.style.display = 'block';
            downloadLink.textContent = 'Download Compressed File (Base64 Encoded)';

            setTimeout(() => URL.revokeObjectURL(url), 3000);

        } catch (error) {
            alert("An error occurred during compression.");
            console.error(error);
        }
    };
    reader.onerror = function () {
        alert("Failed to read the file.");
    };
    reader.readAsText(files[0]);
});


function base64ToBlob(base64, mime) {
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return new Blob([buffer], { type: mime });
}


function base64ToBinary(base64Str) {
    const binaryString = atob(base64Str);
    let binaryStr = '';
    for (let i = 0; i < binaryString.length; i++) {
        const byte = binaryString.charCodeAt(i).toString(2);
        binaryStr += byte.padStart(8, '0');
    }
    return binaryStr;
}


function decompressString(compressedStr, huffmanTree) {
    let result = '';
    let currentNode = huffmanTree;

    for (let bit of compressedStr) {
        currentNode = (bit === '0') ? currentNode.left : currentNode.right;

        if (currentNode.char !== null) {
            result += currentNode.char;
            currentNode = huffmanTree;
        }
    }

    return result;
}


document.getElementById('decompressBtn').addEventListener('click', () => {
    const compressedFile = document.getElementById('fileInput').files[0];

    if (!compressedFile) {
        alert('Please select a compressed file to decompress.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
       
        const base64Content = e.target.result.split(',')[1];

        try {
            
            const binaryCompressed = base64ToBinary(base64Content);
            
            const serializedTree = localStorage.getItem('huffmanTree');
            if (!serializedTree) {
                alert("No Huffman Tree found for decompression. Please compress a file first.");
                return;
            }
            const huffmanTree = deserializeTree(JSON.parse(serializedTree));

            
            const decompressedContent = decompressString(binaryCompressed, huffmanTree);

            
            const blob = new Blob([decompressedContent], { type: 'text/plain' });
            const downloadLink = document.getElementById('decompressedDownloadLink');
            const url = URL.createObjectURL(blob);

            downloadLink.href = url;
            downloadLink.download = 'decompressed_file.txt';
            downloadLink.style.display = 'block';
            downloadLink.textContent = 'Download Decompressed File';

            setTimeout(() => URL.revokeObjectURL(url), 3000);

        } catch (error) {
            alert("An error occurred during decompression.");
            console.error(error);
        }
    };

    reader.onerror = function () {
        alert("Failed to read the compressed file.");
    };

    
    reader.readAsDataURL(compressedFile);
});
