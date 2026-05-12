# DAM Assets for AEM Upload

These files contain all images, PDFs, and assets downloaded from the Tennis NSW source site (tennis.com.au/nsw/) for manual upload to AEM DAM.

## How to reassemble

```bash
cat dam-assets-part-* > dam-assets.tar.gz
tar -xzf dam-assets.tar.gz
```

This will extract to: `content/dam/tennis-nsw/` with the full folder structure matching AEM DAM paths.

## Structure

```
content/dam/tennis-nsw/
  nsw/
    files/
      2024/
      2025/
      2026/
    theme/
```

## Upload to AEM

Upload the `content/dam/tennis-nsw/` folder contents to AEM DAM at `/content/dam/tennis-nsw/`. AEM will handle image optimization and serve them via the media pipeline.

## Stats

- Total assets: 802+
- Total size: ~414MB (uncompressed)
- Includes: JPG, PNG, SVG, PDF, XLSX, DOC files
