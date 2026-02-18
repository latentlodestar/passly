#!/usr/bin/env bash
set -euo pipefail

MODEL_DIR="$(dirname "$0")/../src/Passly.Core/Models"
ONNX_FILE="$MODEL_DIR/all-MiniLM-L6-v2.onnx"
VOCAB_FILE="$MODEL_DIR/vocab.txt"

ONNX_URL="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"
VOCAB_URL="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/vocab.txt"

mkdir -p "$MODEL_DIR"

if [ -f "$ONNX_FILE" ]; then
    echo "ONNX model already exists at $ONNX_FILE"
else
    echo "Downloading all-MiniLM-L6-v2 ONNX model..."
    curl -L --progress-bar -o "$ONNX_FILE" "$ONNX_URL"
    echo "Downloaded ONNX model to $ONNX_FILE"
fi

if [ -f "$VOCAB_FILE" ]; then
    echo "Vocabulary file already exists at $VOCAB_FILE"
else
    echo "Downloading vocabulary file..."
    curl -L --progress-bar -o "$VOCAB_FILE" "$VOCAB_URL"
    echo "Downloaded vocabulary to $VOCAB_FILE"
fi

echo "Model files ready."
