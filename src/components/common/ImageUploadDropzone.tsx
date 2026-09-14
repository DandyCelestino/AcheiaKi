import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Star,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';

interface ImageUploadDropzoneProps {
  label?: string;
  helperText?: string;
  multiple?: boolean;
  value: string | string[];
  onChange: (value: any) => void;
  aspectRatio?: 'square' | 'banner' | 'circle' | 'video' | 'auto';
  maxImages?: number;
  maxDimension?: number;
  enableCamera?: boolean;
  enableUrlPaste?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Client-side image compressor using HTMLCanvasElement.
 * Automatically scales down high-resolution smartphone photos to web-friendly dimensions and size.
 */
export const compressImageFile = (
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw base64 if canvas is unavailable
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Fill background with white for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback directly to base64
        resolve(readerEvent.target?.result as string);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  label,
  helperText,
  multiple = false,
  value,
  onChange,
  aspectRatio = 'auto',
  maxImages = 6,
  maxDimension = 1200,
  enableCamera = true,
  enableUrlPaste = true,
  required = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Normalize images list
  const imagesList: string[] = multiple
    ? Array.isArray(value)
      ? value.filter(Boolean)
      : value
      ? [value]
      : []
    : typeof value === 'string' && value.trim()
    ? [value]
    : Array.isArray(value) && value.length > 0
    ? [value[0]]
    : [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) {
        setErrorMessage('Nenhum arquivo de imagem válido selecionado. Por favor, envie arquivos JPG, PNG ou WEBP.');
        setIsProcessing(false);
        return;
      }

      const processedDataUrls: string[] = [];
      for (const file of validFiles) {
        if (multiple && imagesList.length + processedDataUrls.length >= maxImages) {
          break;
        }
        const dataUrl = await compressImageFile(file, maxDimension);
        processedDataUrls.push(dataUrl);
        if (!multiple) break;
      }

      if (multiple) {
        const updated = [...imagesList, ...processedDataUrls].slice(0, maxImages);
        onChange(updated);
      } else {
        onChange(processedDataUrls[0] || '');
      }
    } catch (err) {
      console.error('Error processing images:', err);
      setErrorMessage('Erro ao carregar a imagem. Tente novamente ou use outro arquivo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [imagesList, multiple, maxImages]
  );

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple) {
      const updated = imagesList.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange('');
    }
  };

  const handleSetPrimary = (index: number) => {
    if (!multiple || index === 0) return;
    const selected = imagesList[index];
    const rest = imagesList.filter((_, idx) => idx !== index);
    onChange([selected, ...rest]);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    if (multiple) {
      if (imagesList.length >= maxImages) {
        setErrorMessage(`Limite máximo de ${maxImages} imagens atingido.`);
        return;
      }
      onChange([...imagesList, customUrl.trim()]);
    } else {
      onChange(customUrl.trim());
    }

    setCustomUrl('');
    setShowUrlInput(false);
  };

  // Determine frame styling based on aspect ratio
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'circle':
        return 'w-24 h-24 sm:w-28 sm:h-28 rounded-full';
      case 'banner':
        return 'w-full h-32 sm:h-44 rounded-xl';
      case 'square':
        return 'w-full aspect-square rounded-xl';
      case 'video':
        return 'w-full aspect-video rounded-xl';
      default:
        return 'w-full aspect-4/3 rounded-xl';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Info */}
      {(label || helperText) && (
        <div className="flex flex-wrap items-center justify-between gap-1">
          {label && (
            <label className="block text-xs font-bold text-slate-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          )}
          {helperText && <span className="text-[11px] text-slate-500">{helperText}</span>}
          {multiple && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {imagesList.length} de {maxImages} fotos
            </span>
          )}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/heic, image/heif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {enableCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      )}

      {/* SINGLE IMAGE PREVIEW MODE */}
      {!multiple && imagesList.length > 0 ? (
        <div className="space-y-3">
          <div className="relative group overflow-hidden bg-slate-900 border border-slate-200 shadow-sm flex items-center justify-center p-1 rounded-2xl">
            <div className={`overflow-hidden bg-slate-950/20 flex items-center justify-center ${getAspectRatioClasses()}`}>
              <img
                src={imagesList[0]}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Overlay Quick Actions */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => setPreviewZoomImage(imagesList[0])}
                className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-xl font-bold text-xs shadow-md flex items-center gap-1"
                title="Ampliar visualização"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Ver</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1"
                title="Substituir foto"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Trocar</span>
              </button>

              <button
                type="button"
                onClick={() => handleRemoveImage(0)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1"
                title="Remover foto"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>
          </div>

          {/* Action buttons below single image */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Escolher do Computador / Celular</span>
            </button>

            {enableCamera && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Tirar Foto</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleRemoveImage(0)}
              className="py-2 px-3 text-red-600 hover:bg-red-50 font-bold rounded-xl border border-red-200 transition-all flex items-center justify-center"
              title="Remover"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* MULTIPLE IMAGES PREVIEW GRID */}
      {multiple && imagesList.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {imagesList.map((imgUrl, index) => (
              <div
                key={index}
                className="relative group rounded-xl overflow-hidden border-2 bg-slate-100 aspect-square shadow-2xs transition-all hover:border-blue-500"
              >
                <img
                  src={imgUrl}
                  alt={`Foto ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Primary Photo Badge */}
                {index === 0 ? (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-emerald-600 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    Capa Principal
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="absolute top-1.5 left-1.5 p-1 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-md text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-xs"
                    title="Definir como foto principal de capa"
                  >
                    <Star className="w-3 h-3 text-amber-300" />
                    <span>Tornar Capa</span>
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                  title="Excluir esta foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Bottom index label */}
                <span className="absolute bottom-1 right-1.5 px-1.5 py-0.2 bg-slate-950/70 text-slate-300 text-[9px] rounded font-mono">
                  #{index + 1}
                </span>
              </div>
            ))}

            {/* Add more slot if limit not reached */}
            {imagesList.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 rounded-xl aspect-square flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition-all p-2 gap-1"
              >
                <Plus className="w-6 h-6" />
                <span className="text-[10px] font-bold text-center leading-tight">Adicionar Mais Fotos</span>
              </button>
            )}
          </div>

          {/* Action Bar for Multiple Uploads */}
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            {imagesList.length < maxImages && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Adicionar Fotos do PC / Celular</span>
                </button>

                {enableCamera && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tirar Foto</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* EMPTY DROPZONE (WHEN NO IMAGES AT ALL) */}
      {imagesList.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 transition-all text-center flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/80'
          }`}
        >
          {isProcessing ? (
            <div className="py-4 space-y-2 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-slate-800">Otimizando e preparando imagem...</p>
              <p className="text-[10px] text-slate-500">Ajustando resolução para carregamento ultrarrápido</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600">
                <ImageIcon className="w-6 h-6" />
              </div>

              <div className="space-y-1 max-w-sm">
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Carregue direto do seu <strong className="text-emerald-700">Computador</strong> ou <strong className="text-emerald-700">Celular</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  {multiple
                    ? `Selecione até ${maxImages} fotos da sua galeria ou arraste os arquivos aqui.`
                    : 'Arraste e solte o arquivo aqui ou use os botões abaixo.'}
                </p>
              </div>

              {/* Main Selection Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Escolher Arquivo(s)</span>
                </button>

                {enableCamera && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Câmera do Celular</span>
                  </button>
                )}
              </div>

              {/* Badges of compatibility */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-slate-500" /> Celular / Galeria
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-500" /> PC / Pastas
                </span>
                <span>•</span>
                <span>JPG, PNG, WEBP</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL TOGGLE ACCORDION (OPTIONAL WEB LINK) */}
      {enableUrlPaste && (
        <div className="pt-1">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Ou colar link direto de imagem na web (opcional)</span>
            </button>
          ) : (
            <form onSubmit={handleApplyUrl} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-blue-600" />
                  <span>Colar URL de imagem pública:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://exemplo.com/minha-imagem.jpg"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Adicionar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img
              src={previewZoomImage}
              alt="Visualização ampliada"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/90 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
