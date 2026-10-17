# YOLOv11-Nano Instagram Profile & Grid Detector Model

Place your trained `ig_detector.onnx` model file in this directory:
`public/models/ig_detector.onnx`

## How to Train & Export on Google Colab
1. Open [Google Colab](https://colab.research.google.com/)
2. Upload [`colab/IGOTYOU_YOLO_Trainer.ipynb`](../../colab/IGOTYOU_YOLO_Trainer.ipynb)
3. Select **Runtime -> Change runtime type -> T4 GPU** (or L4 GPU)
4. Click **Runtime -> Run all**
5. When training finishes (~6-10 minutes), `ig_detector.onnx` (~5-10 MB) will automatically download.
6. Move `ig_detector.onnx` into this `public/models/` directory and deploy!
