'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon, TextIcon } from '@/components/ui/CounterIcons';
import type { Counter } from '@/types';

// Extended counter interface with custom properties
interface ExtendedCounter extends Counter {
  customImage?: string;
  customText?: string;
  customTextSize?: 'sm' | 'md' | 'lg' | 'xl';
  customTextColor?: 'white' | 'golden' | 'yellow' | 'orange';
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
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    const extendedCounter = counter as ExtendedCounter;
    return extendedCounter.customImage || null;
  });
  const [textValue, setTextValue] = useState((counter as ExtendedCounter).customText || '');
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg' | 'xl'>((counter as ExtendedCounter).customTextSize || 'md');
  const [textColor, setTextColor] = useState<'white' | 'golden' | 'yellow' | 'orange'>((counter as ExtendedCounter).customTextColor || 'white');
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

  // Load fallback image from localStorage if counter data doesn't have one
  useEffect(() => {
    const extendedCounter = counter as ExtendedCounter;
    const savedImages = safeGetItem('counterCustomImages');
    const fallbackImage = savedImages[`${counter.id}_fallback`] || savedImages[counter.id];

    if (fallbackImage && !imagePreview && !extendedCounter.customImage) {
      console.log('🔄 Loading image from localStorage fallback in customization');
      setImagePreview(fallbackImage);
      onUpdate({ customImage: fallbackImage } as Partial<ExtendedCounter>);
    }
  }, [counter, imagePreview, onUpdate]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input triggered');
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      console.log('🖼️ Valid image file selected:', file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        console.log('✅ Image loaded as base64, length:', base64Image.length);
        setImagePreview(base64Image);
        onUpdate({ customImage: base64Image } as Partial<ExtendedCounter>);

        // Always save to localStorage as fallback (try anyway)
        try {
          const savedImages = safeGetItem('counterCustomImages');
          savedImages[`${counter.id}_fallback`] = base64Image;
          safeSetItem('counterCustomImages', savedImages);
          console.log('💾 Image saved to localStorage as fallback');

          // Also try to save the main entry (for small images)
          if (base64Image.length < 500000) { // 500KB limit
            savedImages[counter.id] = base64Image;
            safeSetItem('counterCustomImages', savedImages);
          }

          // Clean up old fallback entries periodically (keep only last 10)
          const fallbackKeys = Object.keys(savedImages).filter(key => key.endsWith('_fallback'));
          if (fallbackKeys.length > 10) {
            fallbackKeys.sort().slice(0, fallbackKeys.length - 10).forEach(key => {
              delete savedImages[key];
            });
            safeSetItem('counterCustomImages', savedImages);
            console.log('🧹 Cleaned up old localStorage image entries');
          }
        } catch (error) {
          console.warn('⚠️ Could not save image to localStorage:', error);
        }
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ No valid image file selected');
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onUpdate({ customImage: undefined } as Partial<ExtendedCounter>);

    // Safely remove from localStorage
    const savedImages = safeGetItem('counterCustomImages');
    delete savedImages[counter.id];
    delete savedImages[`${counter.id}_fallback`];
    safeSetItem('counterCustomImages', savedImages);
  };

  const handleTextChange = (newText: string) => {
    setTextValue(newText);
    onUpdate({
      customText: newText,
      customTextSize: textSize,
      customTextColor: textColor
    } as Partial<ExtendedCounter>);

    // Safely save to localStorage
    const savedTexts = safeGetItem('counterCustomTexts');
    savedTexts[counter.id] = newText;
    safeSetItem('counterCustomTexts', savedTexts);

    // Save text size
    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    savedTextSizes[counter.id] = textSize;
    safeSetItem('counterCustomTextSizes', savedTextSizes);

    // Save text color
    const savedTextColors = safeGetItem('counterCustomTextColors');
    savedTextColors[counter.id] = textColor;
    safeSetItem('counterCustomTextColors', savedTextColors);
  };

  const handleTextSizeChange = (newSize: 'sm' | 'md' | 'lg' | 'xl') => {
    setTextSize(newSize);
    onUpdate({
      customText: textValue,
      customTextSize: newSize,
      customTextColor: textColor
    } as Partial<ExtendedCounter>);

    // Safely save to localStorage
    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    savedTextSizes[counter.id] = newSize;
    safeSetItem('counterCustomTextSizes', savedTextSizes);
  };

  const handleTextColorChange = (newColor: 'white' | 'golden' | 'yellow' | 'orange') => {
    setTextColor(newColor);
    onUpdate({
      customText: textValue,
      customTextSize: textSize,
      customTextColor: newColor
    } as Partial<ExtendedCounter>);

    // Safely save to localStorage
    const savedTextColors = safeGetItem('counterCustomTextColors');
    savedTextColors[counter.id] = newColor;
    safeSetItem('counterCustomTextColors', savedTextColors);
  };

  const handleClearText = () => {
    setTextValue('');
    onUpdate({
      customText: undefined,
      customTextSize: 'md',
      customTextColor: 'white'
    } as Partial<ExtendedCounter>);

    // Safely remove from localStorage
    const savedTexts = safeGetItem('counterCustomTexts');
    delete savedTexts[counter.id];
    safeSetItem('counterCustomTexts', savedTexts);

    // Remove text size
    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    delete savedTextSizes[counter.id];
    safeSetItem('counterCustomTextSizes', savedTextSizes);

    // Remove text color
    const savedTextColors = safeGetItem('counterCustomTextColors');
    delete savedTextColors[counter.id];
    safeSetItem('counterCustomTextColors', savedTextColors);
  };

  // Safe localStorage utility to prevent quota errors
  const safeGetItem = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.warn(`⚠️ Could not read from localStorage (${key}):`, error);
      return {};
    }
  };

  const safeSetItem = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`⚠️ Could not save to localStorage (${key}):`, error);
      return false;
    }
  };

  return (
    <div className={`flex flex-col gap-2 md:gap-3 ${className}`} style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
      />

      {/* Image Upload Button */}
      <button
        className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-lg md:text-xl border border-gray-700 transition-colors cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖼️ Image upload button clicked');
          fileInputRef.current?.click();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        title="Add Image"
        aria-label="Add custom image"
      >
        <ImageIcon />
      </button>

      {/* Text Button */}
      <button
        className="bg-gray-900 hover:bg-gray-700 text-white rounded-full shadow-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-lg md:text-xl border border-gray-700 transition-colors cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('📝 Text customization button clicked');
          setShowCustomization(!showCustomization);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        title="Add Text"
        aria-label="Add custom text"
      >
        <TextIcon />
      </button>

      {/* Backdrop overlay when panel is open */}
      {showCustomization && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
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
          className="fixed md:absolute bg-gray-800 rounded-lg p-4 md:p-6 shadow-xl border border-gray-600 z-[60]
                     w-[min(90vw,24rem)] max-w-sm mx-4 md:mx-0
                     top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     md:w-auto md:max-w-md md:top-0 md:bottom-auto md:left-auto md:right-2 md:transform-none"
          style={{
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-white">Customize Text</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCustomization(false);
              }}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Text Size Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Text Size
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextSizeChange('sm');
                  }}
                  className={`p-2 rounded border transition-colors ${
                    textSize === 'sm'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Small (A-)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 9h12v6H6V9zm0 8h12v2H6v-2z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextSizeChange('md');
                  }}
                  className={`p-2 rounded border transition-colors ${
                    textSize === 'md'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Medium"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 9h12v6H6V9zm0 8h12v2H6v-2z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextSizeChange('lg');
                  }}
                  className={`p-2 rounded border transition-colors ${
                    textSize === 'lg'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Large (A+)"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 9h12v6H6V9zm0 8h12v2H6v-2z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextSizeChange('xl');
                  }}
                  className={`p-2 rounded border transition-colors ${
                    textSize === 'xl'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Extra Large (A++)"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 9h12v6H6V9zm0 8h12v2H6v-2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Text Color Options */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Text Color
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'white', color: '#FFFFFF', label: 'White' },
                  { key: 'golden', color: '#FBBF24', label: 'Golden' },
                  { key: 'yellow', color: '#FEF08A', label: 'Yellow' },
                  { key: 'orange', color: '#FB923C', label: 'Orange' }
                ].map(({ key, color, label }) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextColorChange(key as any);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      textColor === key ? 'border-white scale-110' : 'border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={label}
                  />
                ))}
              </div>
            </div>

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
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  textColor === 'white' ? 'text-white' :
                  textColor === 'golden' ? 'text-yellow-400' :
                  textColor === 'yellow' ? 'text-yellow-200' :
                  'text-orange-200'
                }`}
                style={{
                  minHeight: '80px',
                  fontSize: textSize === 'sm' ? '0.875rem' :
                           textSize === 'md' ? '1rem' :
                           textSize === 'lg' ? '1.125rem' : '1.25rem',
                  height: 'auto'
                }}
                rows={Math.min(8, Math.max(3, Math.ceil(textValue.length / 50) + 2))}
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
                    src={imagePreview!}
                    alt="Custom counter image"
                    width={400}
                    height={300}
                    className="w-full max-h-24 md:max-h-32 h-auto object-cover rounded-md border border-gray-600"
                  />
                  {/* Remove button - always visible */}
                  <div className="absolute top-1 right-1 md:top-2 md:right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ Remove image button clicked');
                        handleRemoveImage();
                      }}
                      className="bg-black bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 text-white rounded-full w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-sm font-bold border border-gray-400 hover:border-gray-300 transition-all duration-200 backdrop-blur-sm"
                      style={{ zIndex: 50 }}
                      title="Remove image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="md:w-5 md:h-5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
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
