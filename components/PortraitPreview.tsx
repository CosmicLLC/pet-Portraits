"use client";

interface PortraitPreviewProps {
  watermarkedImage: string;
}

export default function PortraitPreview({
  watermarkedImage,
}: PortraitPreviewProps) {
  return (
    <div className="w-full flex flex-col items-center animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-brand-green mb-2">
          Your portrait is ready
        </h2>
        <p className="text-gray-500">
          Love it? Choose your format below to get the full resolution
        </p>
      </div>

      {/* Frame mockup — like the competitor sites */}
      <div className="relative">
        {/* Wall shadow */}
        <div className="absolute -inset-4 bg-gradient-to-b from-gray-100 to-transparent rounded-3xl -z-10" />
        {/* Frame */}
        <div className="bg-white p-3 sm:p-4 frame-shadow max-w-md w-full">
          <img
            src={watermarkedImage}
            alt="Generated pet portrait"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
