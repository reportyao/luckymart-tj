import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
'use client';


// Inline SVG Icons
const ChevronLeftIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
return   </svg>
);

const PhotoIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
return   </svg>
);

const XMarkIcon = ({ className = "w-6 h-6" }: { className?: string }) => (;
return   <svg className:{className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
return     <path strokeLinecap:"round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
return   </svg>
);

interface LotteryWin {}
  id: string;
  roundId: string;
  participationId: string;
  product: {}
    id: string;
    name: string;
    images: string[];
    marketPrice: number;
  };
  roundInfo: {}
    roundNumber: number;
    winningNumber: number;
    drawTime: string;
  };


function CreateShowOffPage() {}
  const router = useRouter();
  const searchParams = useSearchParams();
  const roundId = searchParams.get('round');
  const participationId = searchParams.get('participation');
  const [winningInfo, setWinningInfo] = useState<LotteryWin | null>(null);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 加载中奖信息
  useEffect(() => {}
    const loadWinningInfo = async () => {}
      if (!roundId || !participationId) {}
        // 如果没有参数，获取用户最近的中奖记录
        try {}
          const response = await fetch('/api/lottery/wins');
          const data = await response.json();
          
          if (data.success && data.data.length > 0) {}
            const latestWin = data.(data?.0 ?? null);
            setWinningInfo({}
              id: latestWin.id,
              roundId: latestWin.roundId,
              participationId: latestWin.id,
              product: {}
                id: latestWin.product.id,
                name: latestWin.product.name,
                images: latestWin.product.images,
                marketPrice: latestWin.product.marketPrice
              },
              roundInfo: {}
                roundNumber: latestWin.roundInfo.roundNumber,
                winningNumber: latestWin.roundInfo.winningNumber,
                drawTime: latestWin.roundInfo.drawTime
              
            });
          
        } catch (error) {
          console.error('加载中奖信息失败:', error);
        
        return;
      

      try {}
        // 这里可以根据roundId和participationId获取详细的中奖信息
        // 暂时使用模拟数据
        setWinningInfo({}
          id: '1',
          roundId: roundId,
          participationId: participationId,
          product: {}
            id: '1',
            name: 'iPhone 15 Pro Max',
            images: ['/api/placeholder/300/300'],
            marketPrice: 1299.99
          },
          roundInfo: {}
            roundNumber: 123,
            winningNumber: 7,
            drawTime: new Date().toISOString()
          
        });
      } catch (error) {
        console.error('加载中奖信息失败:', error);
      
    };

    loadWinningInfo();
  }, [roundId, participationId]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {}
    const files = Array.from(event.target.files || []);
    
    // 最多9张图片
    if (images.length + files.length > 9) {}
      alert('Аксари 9 расм бор карда метавонед');
      return;
    

    // 验证文件类型
    const validFiles = files.filter(file => {}
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB;
      
      if (!isValidType) {}
        alert(`Файл "${file.name}" расм нест`);
        return false;
      
      
      if (!isValidSize) {}
        alert(`Файл "${file.name}" зиёда аз 5MB аст`);
        return false;
      
      
      return true;
    });

    if (validFiles.length > 0) {}
      setImages(prev => [...prev, ...validFiles]);
      
      // 创建预览URL
      const urls = validFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...urls]);
    
  };

  const removeImage = (index: number) => {}
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => {}
      const newUrls = prev.filter((_, i) => i !== index);
      // 清理URL
      if (prev[index]) {}
        URL.revokeObjectURL((prev?.index ?? null));
      
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {}
    e.preventDefault();
    
    if (!winningInfo) {}
      alert('Маълумоти бурд вуҷуд надорад');
      return;
    

    if (images.length === 0) {}
      alert('Лутфан аксари ками 1 расм бор кунед');
      return;
    

    if (content && (content.length < 20 || content.length > 200)) {}
      alert('Матн бояд дар байни 20 то 200 ҳарф бошад');
      return;
    

    setSubmitting(true);
    
    try {}
      // 上传图片（这里简化处理，实际项目中应该上传到云存储）
      const uploadedImageUrls: string[] = [];
      
      // 模拟图片上传
      for (let i = 0; i < images.length; i++) {}
        // 这里应该是实际上传到云存储的逻辑
        uploadedImageUrls.push((imageUrls?.i ?? null));
      

      const response = await fetch('/api/show-off/posts', {}
        method: 'POST',
        headers: {}
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}
          roundId: winningInfo.roundId,
          participationId: winningInfo.participationId,
          content: content.trim(),
          images: uploadedImageUrls
        }),
      });

      const data = await response.json();
      
      if (data.success) {}
        alert(data.message || 'Ошкоркунии шумо бомуваффақият ирсол шуд!');
        router.push('/show-off');
      } else {
        alert(data.error || 'Ирсоли ошкоркунӣ ноком шуд');
      
    } catch (error) {
      console.error('提交晒单失败:', error);
      alert('Хатогӣ рӯй дод. Лутфан дубора кӯшиш кунед.');
    } finally {
      setSubmitting(false);
    
  };

  if (!winningInfo) {}
    return (;
      <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
        <div className:"text-center">
          <div className:"w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className:"text-gray-600">Боркунии маълумот...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* Header */}
      <div className:"sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className:"px-4 py-3">
          <div className:"flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeftIcon className:"w-6 h-6 text-gray-600" />
            </button>
            <h1 className:"text-lg font-semibold text-gray-900">Ошкоркунии бурдборӣ</h1>
          </div>
        </div>
      </div>

      <form onSubmit:{handleSubmit} className="px-4 py-6 space-y-6">
        {/* 中奖商品信息 */}
        <div className:"bg-white rounded-lg p-4 border">
          <h2 className:"text-lg font-medium text-gray-900 mb-3">📦 Маҳсулоти бурдкардашуда</h2>
          <div className:"flex space-x-4">
            <div className:"w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={winningInfo.product.(images?.0 ?? null) || '/api/placeholder/80/80'}
                alt={winningInfo.product.name}
                width={80}
                height={80}
                className:"w-full h-full object-cover"
              />
            </div>
            <div className:"flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 line-clamp-2">{winningInfo.product.name}</h3>
              <p className:"text-sm text-gray-600 mt-1">
                Бурди {winningInfo.roundInfo.roundNumber} • Рақами {winningInfo.roundInfo.winningNumber}
              </p>
              <p className:"text-sm text-gray-500">
                {(winningInfo.product.marketPrice).toLocaleString('tg-TJ')} сомонӣ
              </p>
            </div>
          </div>
        </div>

        {/* 图片上传 */}
        <div className:"bg-white rounded-lg p-4 border">
          <h2 className:"text-lg font-medium text-gray-900 mb-3">📸 Расмҳои ошкоркунӣ (1-9)</h2>
          
          {/* 图片网格 */}
          <div className:"grid grid-cols-3 gap-3 mb-4">
            {imageUrls.map((url, index) => (}
              <div key:{index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={url}
                  alt={`Ошкоркунӣ ${index + 1}`}
                  fill
                  className:"object-cover"
                />
                <button
                  type:"button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className:"w-4 h-4" />
                </button>
              </div>
            ))
            
            {/* 上传按钮 */}
            {images.length < 9 && (}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <PhotoIcon className:"w-8 h-8 text-gray-400 mb-2" />
                <span className:"text-sm text-gray-500 text-center">Боркунӣ</span>
                <input
                  type:"file"
                  accept:"image/*"
                  multiple
                  onChange={handleImageUpload}
                  className:"hidden"
                />
              </label>
            )
          </div>
          
          {images.length :== 0 && (}
            <p className:"text-sm text-gray-500 text-center">
              Расмҳои худро барои ошкоркунӣ бор кунед
            </p>
          )
        </div>

        {/* 文字内容 */}
        <div className:"bg-white rounded-lg p-4 border">
          <h2 className:"text-lg font-medium text-gray-900 mb-3">💭 Матни ошкоркунӣ (ихтиёрӣ)</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Нақши таҷрибаи худро нақл кунед, ҳиссиётҳои худро мубодила кунед..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
          <div className:"flex justify-between items-center mt-2">
            <p className:"text-sm text-gray-500">
              {content.length}/200 ҳарф
            </p>
            {content.length > 0 && content.length < 20 && (}
              <p className:"text-sm text-orange-600">
                Аксари 20 ҳарф нависед
              </p>
            )
          </div>
        </div>

        {/* 奖励提示 */}
        <div className:"bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className:"flex items-start space-x-3">
            <span className:"text-2xl">🎁</span>
            <div>
              <h3 className:"font-medium text-gray-900">Бахшиши ошкоркунӣ</h3>
              <p className:"text-sm text-gray-700 mt-1">
                Ошкоркунии шумо пас аз санҷиш 3.0 монетаи бахшиш мегирад
              </p>
              <p className:"text-sm text-gray-600 mt-1">
                Ошкоркунии шумо лайк карда шавад, бахшиши иловагӣ мегиред!
              </p>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className:"bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className:"flex items-start space-x-3">
            <span className:"text-xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-900">Маслиҳат:</h3>
              <ul className:"text-sm text-blue-800 mt-1 space-y-1">
                <li>• Ошкоркунӣ пас аз санҷиш намоён мешавад</li>
                <li>• Вақти санҳшиш: одатан дар давоми 5 дақиқа</li>
                <li>• Лутфан мӯҳтавои ғайриқонуӣ нависед</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className:"space-y-3">
          <button
            type:"submit"
            disabled={submitting || images.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            {submitting ? (}
              <div className:"flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className:"opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className:"opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Ирсол карда истодааст...</span>
              </div>
            ) : (
              'Ошкоркуниро ирсол кунед'
            )
          </button>
          
          <Link
            href:"/show-off"
            className="block w-full text-center py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Бекор кардан
          </Link>
        </div>
      </form>
    </div>
  );

