
import React, { useState, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import ReactCrop, { Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
    show: boolean;
    onHide: () => void;
    image: string;
    onSave: (croppedImage: Blob) => void;
    aspect: number;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ show, onHide, image, onSave, aspect }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget;
            const crop = centerCrop(
                makeAspectCrop(
                    {
                        unit: '%',
                        width: 90,
                    },
                    aspect,
                    width,
                    height
                ),
                width,
                height
            );
            setCrop(crop);
        }
    }

    const handleSave = async () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop, 'newFile.jpeg');
            onSave(croppedImageBlob);
            onHide();
        }
    };
    
    function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<Blob> {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        const pixelRatio = window.devicePixelRatio;
        canvas.width = crop.width * pixelRatio;
        canvas.height = crop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    resolve(blob);
                },
                'image/jpeg',
                0.95
            );
        });
    }


    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Edit Image</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-center mb-3">
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={aspect}
                    >
                        <img
                            ref={imgRef}
                            src={image}
                            onLoad={onImageLoad}
                            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                            alt="Crop me"
                        />
                    </ReactCrop>
                </div>
                <Form>
                    <Form.Group>
                        <Form.Label>Zoom</Form.Label>
                        <Form.Control
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Rotate</Form.Label>
                        <Form.Control
                            type="range"
                            min="0"
                            max="360"
                            value={rotate}
                            onChange={(e) => setRotate(Number(e.target.value))}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    Set Image
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ImageCropModal;
