'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon, TextIcon } from '@/components/ui/CounterIcons';
import type { Counter } from '@/types';

interface ExtendedCounter extends Counter {
  customImage?: string;
  customText?: string;
  customTextSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  customTextColor?: 'white' | 'golden' | 'yellow' | 'orange' | 'pink' | 'sky' | 'emerald';
  customTextWeight?: 'regular' | 'bold';
  customTextGlow?: boolean;
}

type CustomTextSize = NonNullable<ExtendedCounter['customTextSize']>;
type CustomTextColor = NonNullable<ExtendedCounter['customTextColor']>;

interface CounterCustomizationProps {
  counter: Counter;
  onUpdate: (updates: Partial<ExtendedCounter>) => void;
  className?: string;
  onModalOpenChange?: (open: boolean) => void;
}

const MAX_IMAGE_DIMENSION = 1600;

const TEXT_SIZE_OPTIONS: readonly {
  size: CustomTextSize;
  label: string;
  previewClass: string;
}[] = [
  { size: 'xs', label: 'Extra Small', previewClass: 'text-xs md:text-sm' },
  { size: 'sm', label: 'Small', previewClass: 'text-sm md:text-base' },
  { size: 'md', label: 'Medium', previewClass: 'text-base md:text-lg' },
  { size: 'lg', label: 'Large', previewClass: 'text-lg md:text-xl' },
  { size: 'xl', label: 'Extra Large', previewClass: 'text-xl md:text-2xl' },
  { size: 'xxl', label: 'Display', previewClass: 'text-2xl md:text-3xl' }
] as const;

const TEXT_COLOR_OPTIONS: readonly {
  key: CustomTextColor;
  label: string;
  color: string;
}[] = [
  { key: 'white', label: 'White', color: '#FFFFFF' },
  { key: 'golden', label: 'Golden', color: '#FBBF24' },
  { key: 'yellow', label: 'Yellow', color: '#FEF08A' },
  { key: 'orange', label: 'Orange', color: '#FB923C' },
  { key: 'pink', label: 'Rose', color: '#F472B6' },
  { key: 'sky', label: 'Sky', color: '#38BDF8' },
  { key: 'emerald', label: 'Emerald', color: '#34D399' }
] as const;

const TEXT_COLOR_HEX = TEXT_COLOR_OPTIONS.reduce<Record<CustomTextColor, string>>((acc, option) => {
  acc[option.key] = option.color;
  return acc;
}, {} as Record<CustomTextColor, string>);

const CounterCustomization: React.FC<CounterCustomizationProps> = ({
  counter,
  onUpdate,
  className = '',
  onModalOpenChange
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(() => {
    const extendedCounter = counter as ExtendedCounter;
    return extendedCounter.customImage || null;
  });
  const [textValue, setTextValue] = useState((counter as ExtendedCounter).customText || '');
  const [textSize, setTextSize] = useState<CustomTextSize>((counter as ExtendedCounter).customTextSize || 'md');
  const [textColor, setTextColor] = useState<CustomTextColor>((counter as ExtendedCounter).customTextColor || 'white');
  const [textWeight, setTextWeight] = useState<'regular' | 'bold'>((counter as ExtendedCounter).customTextWeight || 'regular');
  const [textGlow, setTextGlow] = useState<boolean>((counter as ExtendedCounter).customTextGlow ?? false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onModalOpenChange?.(showCustomization);
    return () => {
      if (showCustomization) {
        onModalOpenChange?.(false);
      }
    };
  }, [showCustomization, onModalOpenChange]);

  useEffect(() => {
    if (!showCustomization) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowCustomization(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomization]);

  useEffect(() => {
    const extendedCounter = counter as ExtendedCounter;
    setTextValue(extendedCounter.customText || '');
    setTextSize(extendedCounter.customTextSize || 'md');
    setTextColor(extendedCounter.customTextColor || 'white');
    setTextWeight(extendedCounter.customTextWeight || 'regular');
    setTextGlow(extendedCounter.customTextGlow ?? false);
    setImagePreview(extendedCounter.customImage || null);
  }, [counter]);

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

  const compressImageLossless = async (file: File): Promise<string> => {
    if (typeof window === 'undefined') {
      throw new Error('Image compression is only available in the browser');
    }

    const objectUrl = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = objectUrl;
    }).finally(() => {
      URL.revokeObjectURL(objectUrl);
    });

    let { width, height } = image;
    const maxDimension = Math.max(width, height);
    if (maxDimension > MAX_IMAGE_DIMENSION) {
      const scale = MAX_IMAGE_DIMENSION / maxDimension;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create canvas context for image compression');
    }
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );

    if (!blob) {
      throw new Error('Failed to compress image');
    }

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert compressed image to base64'));
      reader.readAsDataURL(blob);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input triggered');
    const inputEl = event.target;
    const file = inputEl.files?.[0];
    if (file && file.type.startsWith('image/')) {
      console.log('🖼️ Valid image file selected:', file.name);
      try {
        const base64Image = await compressImageLossless(file);
        console.log('✅ Image compressed and converted to base64, length:', base64Image.length);
        setImagePreview(base64Image);
        onUpdate({ customImage: base64Image } as Partial<ExtendedCounter>);

        try {
          const savedImages = safeGetItem('counterCustomImages');
          savedImages[`${counter.id}_fallback`] = base64Image;
          safeSetItem('counterCustomImages', savedImages);
          console.log('💾 Image saved to localStorage as fallback');

          if (base64Image.length < 500000) {
            savedImages[counter.id] = base64Image;
            safeSetItem('counterCustomImages', savedImages);
          }

          const fallbackKeys = Object.keys(savedImages).filter(key => key.endsWith('_fallback'));
          if (fallbackKeys.length > 10) {
            fallbackKeys
              .sort()
              .slice(0, fallbackKeys.length - 10)
              .forEach(key => {
                delete savedImages[key];
              });
            safeSetItem('counterCustomImages', savedImages);
            console.log('🧹 Cleaned up old localStorage image entries');
          }
        } catch (error) {
          console.warn('⚠️ Could not save image to localStorage:', error);
        }
      } catch (error) {
        console.warn('⚠️ Failed to process image upload:', error);
      }
    } else {
      console.log('❌ No valid image file selected');
    }

    // Reset input value so selecting the same file again still triggers change
    inputEl.value = '';
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onUpdate({ customImage: undefined } as Partial<ExtendedCounter>);

    const savedImages = safeGetItem('counterCustomImages');
    delete savedImages[counter.id];
    delete savedImages[`${counter.id}_fallback`];
    safeSetItem('counterCustomImages', savedImages);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextChange = (newText: string) => {
    setTextValue(newText);
    onUpdate({
      customText: newText,
      customTextSize: textSize,
      customTextColor: textColor,
      customTextWeight: textWeight,
      customTextGlow: textGlow
    } as Partial<ExtendedCounter>);

    const savedTexts = safeGetItem('counterCustomTexts');
    savedTexts[counter.id] = newText;
    safeSetItem('counterCustomTexts', savedTexts);

    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    savedTextSizes[counter.id] = textSize;
    safeSetItem('counterCustomTextSizes', savedTextSizes);

    const savedTextColors = safeGetItem('counterCustomTextColors');
    savedTextColors[counter.id] = textColor;
    safeSetItem('counterCustomTextColors', savedTextColors);

    const savedTextWeights = safeGetItem('counterCustomTextWeights');
    savedTextWeights[counter.id] = textWeight;
    safeSetItem('counterCustomTextWeights', savedTextWeights);

    const savedTextGlow = safeGetItem('counterCustomTextGlow');
    savedTextGlow[counter.id] = textGlow;
    safeSetItem('counterCustomTextGlow', savedTextGlow);
  };

  const handleTextSizeChange = (newSize: CustomTextSize) => {
    setTextSize(newSize);
    onUpdate({
      customText: textValue,
      customTextSize: newSize,
      customTextColor: textColor,
      customTextWeight: textWeight,
      customTextGlow: textGlow
    } as Partial<ExtendedCounter>);

    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    savedTextSizes[counter.id] = newSize;
    safeSetItem('counterCustomTextSizes', savedTextSizes);
  };

  const handleTextColorChange = (newColor: CustomTextColor) => {
    setTextColor(newColor);
    onUpdate({
      customText: textValue,
      customTextSize: textSize,
      customTextColor: newColor,
      customTextWeight: textWeight,
      customTextGlow: textGlow
    } as Partial<ExtendedCounter>);

    const savedTextColors = safeGetItem('counterCustomTextColors');
    savedTextColors[counter.id] = newColor;
    safeSetItem('counterCustomTextColors', savedTextColors);
  };

  const handleClearText = () => {
    setTextValue('');
    setTextSize('md');
    setTextWeight('regular');
    setTextGlow(false);
    onUpdate({
      customText: undefined,
      customTextSize: 'md',
      customTextColor: 'white',
      customTextWeight: 'regular',
      customTextGlow: false
    } as Partial<ExtendedCounter>);

    const savedTexts = safeGetItem('counterCustomTexts');
    delete savedTexts[counter.id];
    safeSetItem('counterCustomTexts', savedTexts);

    const savedTextSizes = safeGetItem('counterCustomTextSizes');
    delete savedTextSizes[counter.id];
    safeSetItem('counterCustomTextSizes', savedTextSizes);

    const savedTextColors = safeGetItem('counterCustomTextColors');
    delete savedTextColors[counter.id];
    safeSetItem('counterCustomTextColors', savedTextColors);

    const savedTextWeights = safeGetItem('counterCustomTextWeights');
    delete savedTextWeights[counter.id];
    safeSetItem('counterCustomTextWeights', savedTextWeights);

    const savedTextGlow = safeGetItem('counterCustomTextGlow');
    delete savedTextGlow[counter.id];
    safeSetItem('counterCustomTextGlow', savedTextGlow);
  };

  const safeGetItem = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.warn(`⚠️ Could not read from localStorage (${key}):`, error);
      return {};
    }
  };

  const safeSetItem = (key: string, value: unknown) => {
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
      />

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

      {showCustomization && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[55]"
          onClick={(e) => {
            e.stopPropagation();
            setShowCustomization(false);
          }}
        />
      )}

      {showCustomization && (
        <div
          ref={panelRef}
          className="fixed md:absolute bg-gray-800 rounded-2xl p-4 md:p-6 shadow-xl border border-gray-600 z-[60]
                     w-[min(92vw,24rem)] max-w-md
                     top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     md:w-auto md:max-w-md md:top-0 md:bottom-auto md:left-auto md:right-2 md:transform-none"
          style={{
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-white text-center">Customize Text</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCustomization(false);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 hover:text-white transition-all p-1.5 rounded-full border border-gray-400/60 bg-gray-700/70 hover:bg-gray-600/90 shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
              title="Close"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {TEXT_SIZE_OPTIONS.map(({ size, label, previewClass }) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextSizeChange(size);
                  }}
                  className={`p-2 rounded-xl border transition-colors flex items-center justify-center w-11 h-11 md:w-12 md:h-12 ${
                    textSize === size
                      ? 'bg-blue-600 border-blue-500 text-white shadow-inner'
                      : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                  }`}
                  title={label}
                  aria-label={`Set text size to ${label}`}
                >
                  <span className={`font-semibold leading-none ${previewClass}`}>A</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {TEXT_COLOR_OPTIONS.map(({ key, color, label }) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextColorChange(key);
                  }}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    textColor === key ? 'border-white scale-110 shadow-sm' : 'border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={label}
                  aria-label={`Set text color ${label}`}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = textWeight === 'bold' ? 'regular' : 'bold';
                  setTextWeight(next);
                  onUpdate({
                    customText: textValue,
                    customTextSize: textSize,
                    customTextColor: textColor,
                    customTextWeight: next,
                    customTextGlow: textGlow
                  } as Partial<ExtendedCounter>);

                  const savedTextWeights = safeGetItem('counterCustomTextWeights');
                  savedTextWeights[counter.id] = next;
                  safeSetItem('counterCustomTextWeights', savedTextWeights);
                }}
                className={`px-3 py-2 rounded-xl border transition-colors text-sm font-semibold flex items-center justify-center gap-2 min-w-[3rem] ${
                  textWeight === 'bold'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-inner'
                    : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                }`}
                title={textWeight === 'bold' ? 'Disable bold' : 'Enable bold'}
                aria-pressed={textWeight === 'bold'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  <path d="M7 6h7a3 3 0 0 1 0 6H7z" />
                  <path d="M7 12h9a3 3 0 0 1 0 6H7z" />
                </svg>
                <span className="sr-only">Toggle bold</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = !textGlow;
                  setTextGlow(next);
                  onUpdate({
                    customText: textValue,
                    customTextSize: textSize,
                    customTextColor: textColor,
                    customTextWeight: textWeight,
                    customTextGlow: next
                  } as Partial<ExtendedCounter>);

                  const savedTextGlow = safeGetItem('counterCustomTextGlow');
                  savedTextGlow[counter.id] = next;
                  safeSetItem('counterCustomTextGlow', savedTextGlow);
                }}
                className={`px-3 py-2 rounded-xl border transition-colors text-sm font-semibold flex items-center justify-center gap-2 min-w-[3rem] ${
                  textGlow
                    ? 'bg-purple-600 border-purple-400 text-white shadow-inner'
                    : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                }`}
                title={textGlow ? 'Disable glow' : 'Enable glow'}
                aria-pressed={textGlow}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.42 1.42" />
                  <path d="m17.65 17.65 1.42 1.42" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.35 17.65-1.42 1.42" />
                  <path d="m19.07 4.93-1.42 1.42" />
                </svg>
                <span className="sr-only">Toggle glow</span>
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={textValue}
                onChange={(e) => {
                  e.stopPropagation();
                  handleTextChange(e.target.value);
                }}
                placeholder="Enter custom text..."
                className={`w-full px-4 py-3 bg-gray-700/80 border border-gray-600/80 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white`}
                style={{
                  minHeight: '112px',
                  fontSize:
                    textSize === 'xs' ? '0.85rem' :
                    textSize === 'sm' ? '0.95rem' :
                    textSize === 'md' ? '1.05rem' :
                    textSize === 'lg' ? '1.15rem' :
                    textSize === 'xl' ? '1.25rem' : '1.35rem',
                  lineHeight: 1.5,
                  color: TEXT_COLOR_HEX[textColor]
                }}
                rows={Math.min(10, Math.max(4, Math.ceil(textValue.length / 60) + 2))}
              />
              <div className="flex flex-row flex-wrap items-center justify-end gap-2">
                {textValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearText();
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-red-400/70 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 hover:border-red-300 transition-colors"
                  >
                    Clear Text
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCustomization(false);
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-500/70 bg-gray-700/40 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600/50 hover:border-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Image Preview
                </label>
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Custom counter image"
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-48 md:max-h-60 object-contain rounded-md border border-gray-600"
                  />
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
