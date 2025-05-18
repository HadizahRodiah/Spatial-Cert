'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toCanvas } from 'qrcode';
import { toPng, toBlob } from 'html-to-image';
import {
    DocumentPlusIcon,
    PrinterIcon,
    ShareIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface CertificateData {
    id: string;
    date: string;
    expiryDate: string;
    registrationNumber: string;
    fullName: string;
    emailAddress: string;
    courseCompleted: string;
    levelCompleted: string;
    signature: string;
    qrCode: string;
}

const CertificateDisplay: React.FC = () => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const certificateBaseClassNames = useMemo(() => `
        relative
        w-[90vw] max-w-[800px]
        h-auto /* Ensure height adjusts to content */
        rotate-0
        rounded-xl shadow-2xl p-4 sm:p-6 md:p-10
        border-4 border-opacity-20 border-blue-400
        bg-gradient-to-br from-white to-gray-100
        origin-center
        mb-8
    `, []);

    const [isCapturing, setIsCapturing] = useState(false);

    const certificateClassNames = useMemo(() => {
        return `${certificateBaseClassNames} ${isCapturing ? 'overflow-visible' : 'overflow-auto'}`;
    }, [certificateBaseClassNames, isCapturing]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const data: Partial<CertificateData> = {};
        const requiredKeys: (keyof CertificateData)[] = [
            'id', 'date', 'expiryDate', 'registrationNumber',
            'fullName', 'emailAddress', 'courseCompleted',
            'levelCompleted', 'signature', 'qrCode'
        ];

        let allRequiredPresent = true;
        requiredKeys.forEach((key) => {
            const value = searchParams.get(key);
            if (value) {
                data[key] = decodeURIComponent(value);
            } else {
                allRequiredPresent = false;
            }
        });

        if (allRequiredPresent) {
            setCertificateData(data as CertificateData);
        } else {
            setCertificateData(null);
            setErrorMessage('Certificate data is incomplete in the URL.');
        }

        setInitialLoading(false);
    }, []);

    const generateQrCode = useCallback(async () => {
        if (certificateData?.qrCode && qrCodeRef.current) {
            try {
                await toCanvas(qrCodeRef.current, certificateData.qrCode, {
                    width: 90,
                    margin: 1,
                    color: { dark: '#000', light: '#fff' },
                });
                const dataUrl = qrCodeRef.current.toDataURL('image/png');
                setQrCodeDataUrl(dataUrl);
            } catch (err) {
                console.error('QR code generation failed:', err);
                setErrorMessage('Failed to generate QR code.');
            }
        }
    }, [certificateData]);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);

    const cleanColorStyles = useCallback((node: unknown): boolean => {
        if (!(node instanceof Element)) return true;
        const style = window.getComputedStyle(node);
        ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
            const val = style.getPropertyValue(prop);
            if (val.includes('oklch') || val.includes('lab')) {
                (node as HTMLElement).style.setProperty(prop, '#000');
            }
        });
        return true;
    }, []);

    const captureImage = useCallback(async () => {
        if (!certificateRef.current) return null;
        try {
            setIsCapturing(true);
            await new Promise((resolve) => setTimeout(resolve, 100)); // Increased delay
            return await toPng(certificateRef.current, {
                filter: cleanColorStyles,
                cacheBust: true,
                pixelRatio: 2,
            });
        } catch (error) {
            console.error('Capture failed:', error);
            setErrorMessage('Failed to capture certificate as image.');
            return null;
        } finally {
            setIsCapturing(false);
        }
    }, [cleanColorStyles]);

    const handleDownload = useCallback(async () => {
        setLoading(true);
        try {
            const dataUrl = await captureImage();
            if (!dataUrl) return;
            const link = document.createElement('a');
            link.download = `certificate-${certificateData?.registrationNumber}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setLoading(false);
        }
    }, [captureImage, certificateData?.registrationNumber]);

    const handleShare = useCallback(async () => {
        setLoading(true);
        try {
            if (!certificateRef.current) return;
            setIsCapturing(true);
            await new Promise((resolve) => setTimeout(resolve, 100)); // Increased delay
            const blob = await toBlob(certificateRef.current, {
                filter: cleanColorStyles,
                cacheBust: true,
                pixelRatio: 2,
            });
            setIsCapturing(false);

            if (!blob) throw new Error('Blob generation failed');
            const file = new File([blob], `certificate-${certificateData?.registrationNumber}.png`, { type: 'image/png' });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'Certificate of Achievement',
                    text: `I've completed ${certificateData?.courseCompleted}!`,
                    files: [file],
                });
            } else {
                alert('Sharing is not supported on this device.');
            }
        } catch (error) {
            console.error('Share failed:', error);
            alert('Error sharing certificate.');
        } finally {
            setLoading(false);
        }
    }, [cleanColorStyles, certificateData?.courseCompleted, certificateData?.registrationNumber]);

    const handlePrint = useCallback(async () => {
        const dataUrl = await captureImage();
        if (!dataUrl) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head><title>Print Certificate</title><style>body{margin:0;}</style></head>
                <body><img src="${dataUrl}" style="width:100%;" /></body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    }, [captureImage]);

    if (initialLoading) {
        return <div className="h-screen flex justify-center items-center">Loading...</div>;
    }

    if (errorMessage) {
        return <div className="h-screen flex justify-center items-center text-center text-red-500">{errorMessage}</div>;
    }

    if (!certificateData) {
        return <div className="h-screen flex justify-center items-center text-center">Certificate not found. Please check the URL.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-6 px-4 flex flex-col items-center">
            <div
                ref={certificateRef}
                className={certificateClassNames}
                style={{ maxHeight: 'none' }} // Ensure no explicit max-height is set
            >
                <div className="absolute inset-0  z-70">
                    <Image src="/back.png" alt="" layout="fill" objectFit="cover" />
                </div>
                <div className="absolute inset-0 mx-auto w-full h-full object-cover opacity-20 z-0">
                    <Image src="/ssd.png" alt="Watermark" layout="fill" objectFit="cover" />
                </div>

                <div className="relative z-10 text-center">
                    <Image src="/icon.png" className="w-24 mx-auto mb-4" alt="Logo" width={96} height={96} />
                    <h1 className="text-2xl md:text-4xl font-bold uppercase text-gray-800 tracking-wide">
                        The Spatial & Data Science Institute
                    </h1>
                    <p className="text-sm text-gray-500 italic mb-6">*Recognizing Excellence in Learning*</p>

                    <div className="mb-6">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-blue-700 border-b-4 inline-block pb-2 border-blue-500">
                            Certificate of Achievement
                        </h2>
                    </div>

                    <p className="text-base text-black mb-2">This is to certify that</p>
                    <p className="text-3xl md:text-5xl font-bold italic text-indigo-800 mb-3">{certificateData.fullName}</p>
                    <p className="text-base text-gray-700 mb-1">
                        has <span className="italic font-medium text-green-800">successfully completed</span> the
                    </p>
                    <p className="text-2xl font-bold text-blue-800 mb-1">{certificateData.courseCompleted}</p>
                    <p className="text-sm text-gray-600 mb-6">at the <i>{certificateData.levelCompleted}</i> level</p>

                    <div className="flex flex-row justify-center gap-6 mb-10 text-sm text-gray-700">
                        <div>
                            <p className="font-semibold text-black">Issue Date</p>
                            <p className="text-blue-700">{certificateData.date}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-black">Registration No.</p>
                            <p className="text-green-700">{certificateData.registrationNumber}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-black">Expiry Date</p>
                            <p className="text-red-700">{certificateData.expiryDate}</p>
                        </div>
                    </div>

                    <div className="flex flex-row sm:flex-row justify-around items-center gap-6">
                        <div className="text-center">
                            <Image src={certificateData.signature} className="w-24 mx-auto" alt="Student Signature" width={96} height={60} />
                            <p className="text-xs mt-1 text-black border-t">Student Signature</p>
                        </div>

                        <div className="text-center">
                            <canvas ref={qrCodeRef} className="w-24 h-auto mx-auto border rounded-lg shadow-sm" />
                            <p className="text-xs text-black mt-1">Scan to Verify</p>
                            <p className="text-[10px] text-blue-600 break-all">{certificateData.qrCode}</p>
                        </div>
                        <div className="text-center">
                            <Image src="/man.png" className="w-15 mx-auto" alt="Management Signature" width={80} height={60} />
                            <p className="text-xs mt-1 text-black border-t">Management Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            <p className='text-center font-bold text-2xl text-slate-700'>*It is advisable to view ,print and download certificate on desktop view*</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button onClick={handleDownload} disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold shadow-md">
                    <DocumentPlusIcon className="h-5 w-5" />
                    {loading ? 'Downloading...' : 'Download'}
                </button>
                <button onClick={handlePrint} disabled={loading} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md font-semibold shadow-md">
                    <PrinterIcon className="h-5 w-5" />
                    Print
                </button>
                <button onClick={handleShare} disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold shadow-md">
                    <ShareIcon className="h-5 w-5" />
                    Share
                </button>
            </div>
        </div>
    );
};

export default CertificateDisplay;