'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon, TextIcon } from '@/components/ui/CounterIcons';
import type { Counter } from '@/types';

// Extended counter interface with custom properties
interface ExtendedCounter extends Counter {
  customImage?: string;
  customText?: string;
}

/**
 * CounterCustomization component - Handles image and text customization for full screen mode
 */
interface CounterCustomizationProps {
  counter: Counter;
  onUpdate: (updates: Partial<ExtendedCounter>) => void;
  className?: string;
}
const CounterCustomization: React.FC<CounterCustomizationProps> = ({
  counter,
  onUpdate,
  className = ''
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>((counter as ExtendedCounter).customImage || null);
  const [textValue, setTextValue] = useState((counter as ExtendedCounter).customText || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowCustomization(false);
      }
    };

    if (showCustomization) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomization]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setImagePreview(base64Image);
        onUpdate({ customImage: base64Image } as Partial<ExtendedCounter>);

        // Save to localStorage
        const savedImages = JSON.parse(localStorage.getItem('counterCustomImages') || '{}');
        savedImages[counter.id] = base64Image;
        localStorage.setItem('counterCustomImages', JSON.stringify(savedImages));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (newText: string) => {
    setTextValue(newText);
    onUpdate({ customText: newText } as Partial<ExtendedCounter>);

    // Save to localStorage
    const savedTexts = JSON.parse(localStorage.getItem('counterCustomTexts') || '{}');
    savedTexts[counter.id] = newText;
    localStorage.setItem('counterCustomTexts', JSON.stringify(savedTexts));
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onUpdate({ customImage: undefined } as Partial<ExtendedCounter>);

    // Remove from localStorage
    const savedImages = JSON.parse(localStorage.getItem('counterCustomImages') || '{}');
    delete savedImages[counter.id];
    localStorage.setItem('counterCustomImages', JSON.stringify(savedImages));
  };

  const handleClearText = () => {
    setTextValue('');
    onUpdate({ customText: undefined } as Partial<ExtendedCounter>);

    // Remove from localStorage
    const savedTexts = JSON.parse(localStorage.getItem('counterCustomTexts') || '{}');
    delete savedTexts[counter.id];
    localStorage.setItem('counterCustomTexts', JSON.stringify(savedTexts));
  };

  return (
    <div className={`flex flex-col gap-2 md:gap-3 ${className}`}>
      {/* Image Upload Button */}
      <button
        className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-lg md:text-xl border border-gray-700 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        title="Add Image"
        aria-label="Add custom image"
      >
        <ImageIcon />
      </button>

      {/* Text Button */}
      <button
        className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-lg md:text-xl border border-gray-700 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setShowCustomization(!showCustomization);
        }}
        title="Add Text"
        aria-label="Add custom text"
      >
        <TextIcon />
      </button>

      {/* Backdrop overlay when panel is open */}
      {showCustomization && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setShowCustomization(false);
          }}
        />
      )}

      {/* Customization Panel */}
      {showCustomization && (
        <div
          ref={panelRef}
          className="absolute top-0 right-16 md:right-20 bg-gray-800 rounded-lg p-4 md:p-6 shadow-xl border border-gray-600 w-[calc(100vw-5rem)] max-w-sm md:min-w-96 md:max-w-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4 md:space-y-6">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Custom Text
              </label>
              <textarea
                value={textValue}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTextChange(e.target.value);
                }}
                placeholder="Enter custom text..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              {textValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearText();
                  }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear Text
                </button>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Image Preview
                </label>
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Custom counter image"
                    width={400}
                    height={300}
                    className="w-full max-h-32 md:max-h-48 h-auto object-cover rounded-md border border-gray-600"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CounterCustomization;
