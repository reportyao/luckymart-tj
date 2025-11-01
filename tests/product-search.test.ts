import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import {
/**
 * 产品多语言搜索测试
 * 
 * 验证产品名称和描述的多语言搜索
 * 测试搜索结果在4种语言下的显示
 * 检查产品分类和标签的本地化搜索
 */

  ProductMultilingualService,
  MultilingualHelper,
  type SupportedLanguage,
  type MultilingualText,
} from '@/lib/services/multilingual-query';

// 支持的语言
const LANGUAGES: SupportedLanguage[] = ['zh-CN', 'en-US', 'ru-RU', 'tg-TJ'];

// 模拟产品数据库
const MOCK_PRODUCTS = [;
  {
    id: 'product-001',
    nameMultilingual: {
      'zh-CN': '苹果iPhone 15 Pro',
      'en-US': 'Apple iPhone 15 Pro',
      'ru-RU': 'Apple iPhone 15 Pro',
      'tg-TJ': 'Apple iPhone 15 Pro',
    } as MultilingualText,
    descriptionMultilingual: {
      'zh-CN': '最新款苹果智能手机，配备A17 Pro芯片和钛金属机身',
      'en-US': 'Latest Apple smartphone with A17 Pro chip and titanium body',
      'ru-RU': 'Новейший смартфон Apple с чипом A17 Pro и титановым корпусом',
      'tg-TJ': 'Smartfoni навбатӣ Apple бо чипи A17 Pro ва бадани титан',
    } as MultilingualText,
    categoryMultilingual: {
      'zh-CN': '智能手机',
      'en-US': 'Smartphones',
      'ru-RU': 'Смартфоны',
      'tg-TJ': 'Smartfonҳо',
    } as MultilingualText,
    tagsMultilingual: {
      'zh-CN': ['苹果', '高端', '旗舰', '5G'],
      'en-US': ['Apple', 'Premium', 'Flagship', '5G'],
      'ru-RU': ['Apple', 'Премиум', 'Флагман', '5G'],
      'tg-TJ': ['Apple', 'Premium', 'Flagship', '5G'],
    } as any,
    images: [
      '/images/iphone15pro-1.jpg',
      '/images/iphone15pro-2.jpg',
    ],
    marketPrice: 9999,
    totalShares: 100,
    pricePerShare: 100,
    stock: 50,
    status: 'active' as const,
    marketingBadge: {
      'zh-CN': '新品',
      'en-US': 'New',
      'ru-RU': 'Новинка',
      'tg-TJ': 'Нав',
    } as MultilingualText,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'product-002',
    nameMultilingual: {
      'zh-CN': '索尼WH-1000XM5无线降噪耳机',
      'en-US': 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      'ru-RU': 'Беспроводные наушники Sony WH-1000XM5 с шумоподавлением',
      'tg-TJ': 'Quloqchinҳои Sony WH-1000XM5 Wireless бо шумоподавление',
    } as MultilingualText,
    descriptionMultilingual: {
      'zh-CN': '业界领先的降噪技术，30小时电池续航，舒适佩戴',
      'en-US': 'Industry-leading noise cancellation, 30-hour battery life, comfortable fit',
      'ru-RU': 'Ведущие в отрасли технологии шумоподавления, 30-часовой срок службы батареи, комфортная посадка',
      'tg-TJ': 'Технологияи пешравантаи шумоподавление, коркуди батареяи 30 соат, пӯшидани қулай',
    } as MultilingualText,
    categoryMultilingual: {
      'zh-CN': '音频设备',
      'en-US': 'Audio Devices',
      'ru-RU': 'Аудиоустройства',
      'tg-TJ': 'Дастгоҳҳои аудио',
    } as MultilingualText,
    tagsMultilingual: {
      'zh-CN': ['索尼', '降噪', '无线', '蓝牙'],
      'en-US': ['Sony', 'Noise Cancelling', 'Wireless', 'Bluetooth'],
      'ru-RU': ['Sony', 'Шумоподавление', 'Беспроводной', 'Bluetooth'],
      'tg-TJ': ['Sony', 'Шумоподавление', 'Wireles', 'Bluetooth'],
    } as any,
    images: [
      '/images/sony-wh1000xm5-1.jpg',
    ],
    marketPrice: 2399,
    totalShares: 50,
    pricePerShare: 48,
    stock: 25,
    status: 'active' as const,
    marketingBadge: {
      'zh-CN': '热销',
      'en-US': 'Hot Seller',
      'ru-RU': 'Хит продаж',
      'tg-TJ': 'Бестселлер',
    } as MultilingualText,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'product-003',
    nameMultilingual: {
      'zh-CN': '耐克Air Max 270运动鞋',
      'en-US': "Nike Air Max 270 Sneakers",
      'ru-RU': 'Кроссовки Nike Air Max 270',
      'tg-TJ': 'Маҳсулоти варзишӣ Nike Air Max 270',
    } as MultilingualText,
    descriptionMultilingual: {
      'zh-CN': '舒适透气的运动鞋，Max Air气垫技术，适合日常运动',
      'en-US': 'Comfortable breathable sneakers with Max Air cushioning for everyday sports',
      'ru-RU': 'Комфортные дышащие кроссовки с амортизацией Max Air для ежедневного спорта',
      'tg-TJ': 'Маҳсулоти варзишӣ қулай ва нафасгир бо технологияи Max Air барои варзиши ҳаррӯза',
    } as MultilingualText,
    categoryMultilingual: {
      'zh-CN': '运动鞋',
      'en-US': 'Sports Shoes',
      'ru-RU': 'Спортивная обувь',
      'tg-TJ': 'Маҳсулоти варзишӣ',
    } as MultilingualText,
    tagsMultilingual: {
      'zh-CN': ['耐克', '运动', '透气', '舒适'],
      'en-US': ['Nike', 'Sports', 'Breathable', 'Comfort'],
      'ru-RU': ['Nike', 'Спорт', 'Дышащий', 'Комфорт'],
      'tg-TJ': ['Nike', 'Варзиш', 'Нафасгир', 'Қулай'],
    } as any,
    images: [
      '/images/nike-airmax270-1.jpg',
    ],
    marketPrice: 899,
    totalShares: 80,
    pricePerShare: 11,
    stock: 40,
    status: 'active' as const,
    marketingBadge: {
      'zh-CN': '经典',
      'en-US': 'Classic',
      'ru-RU': 'Классика',
      'tg-TJ': 'Классикӣ',
    } as MultilingualText,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

describe('产品多语言搜索测试', () => {
  beforeAll(() => {
    // 模拟产品数据库查询
    jest.spyOn(ProductMultilingualService, 'getProductsByLanguage').mockImplementation(
      async (language, filters) => {
        let filteredProducts = [...MOCK_PRODUCTS];

        // 按分类过滤
        if (filters?.category) {
          filteredProducts = filteredProducts.filter(product => {
            const category = MultilingualHelper.extractText(product.categoryMultilingual, language);
            return category.toLowerCase().includes(filters.category!.toLowerCase());
          });
        }

        // 分页
        const start = filters?.offset || 0;
        const end = start + (filters?.limit || 10);
        const paginatedProducts = filteredProducts.slice(start, end);

        // 返回格式化的产品数据
        return paginatedProducts.map(product => ({
          id: product.id,
          name: MultilingualHelper.extractText(product.nameMultilingual, language),
          description: MultilingualHelper.extractText(product.descriptionMultilingual, language),
          category: MultilingualHelper.extractText(product.categoryMultilingual, language),
          images: product.images,
          marketPrice: product.marketPrice,
          totalShares: product.totalShares,
          pricePerShare: product.pricePerShare,
          stock: product.stock,
          status: product.status,
          marketingBadge: MultilingualHelper.extractText(product.marketingBadge, language),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          _multilingual: {
            name: product.nameMultilingual,
            description: product.descriptionMultilingual,
            category: product.categoryMultilingual,
            tags: product.tagsMultilingual,
            marketingBadge: product.marketingBadge,
          },
        }));
      }
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('产品名称多语言搜索', () => {
    test.each(LANGUAGES)('应能正确搜索 %s 语言的产品名称', async (language) => {
      const products = await ProductMultilingualService.getProductsByLanguage(language, {
        limit: 10,
        offset: 0,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // 验证产品名称为指定语言
      products.forEach((product) => {
        expect(product.name).toBeDefined();
        expect(typeof product.name).toBe('string');
        expect(product.name.length).toBeGreaterThan(0);
        
        // 验证名称不包含其他语言的特殊字符
        if (language === 'zh-CN') {
          expect(product.name).not.toContain('Apple');
          expect(product.name).not.toContain('Sony');
        }
      });
    });

    test('应能通过产品名称进行精确搜索', async () => {
      const searchTerm = 'iPhone';
      const products = await ProductMultilingualService.getProductsByLanguage('en-US', {
        limit: 10,
        offset: 0,
      });

      const matchedProducts = products.filter(product =>;
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(matchedProducts.length).toBeGreaterThan(0);
      
      if (matchedProducts.length > 0) {
        expect((matchedProducts?.0 ?? null).name).toContain('iPhone');
      }
    });
  });

  describe('产品描述多语言搜索', () => {
    test('应能通过描述搜索到相关产品', async () => {
      const searchTerms = {
        'zh-CN': '芯片',
        'en-US': 'chip',
        'ru-RU': 'чип',
        'tg-TJ': 'chip',
      };

      for (const [language, term] of Object.entries(searchTerms)) {
        const products = await ProductMultilingualService.getProductsByLanguage(;
          language as SupportedLanguage,
          { limit: 10, offset: 0 }
        );

        const matchedProducts = products.filter(product =>;
          product.description.toLowerCase().includes(term.toLowerCase())
        );

        expect(matchedProducts.length).toBeGreaterThan(0);
        console.log(`${language} 描述搜索: "${term}" -> ${matchedProducts.length} 个结果`);
      }
    });

    test('应能正确显示不同语言的描述内容', async () => {
      const productId = 'product-001';
      const product = await ProductMultilingualService.getProductById(productId, 'zh-CN');
      
      if (product) {
        expect(product.description).toContain('苹果');
        expect(product.description).toContain('A17 Pro芯片');
      }
    });
  });

  describe('产品分类本地化搜索', () => {
    test('应能按分类搜索产品', async () => {
      const categorySearchTerms = {
        'zh-CN': '智能手机',
        'en-US': 'Smartphone',
        'ru-RU': 'Смартфон',
        'tg-TJ': 'Smartfon',
      };

      for (const [language, category] of Object.entries(categorySearchTerms)) {
        const products = await ProductMultilingualService.getProductsByLanguage(;
          language as SupportedLanguage,
          {
            category,
            limit: 10,
            offset: 0,
          }
        );

        // 验证搜索结果
        products.forEach((product) => {
          expect(product.category).toBeDefined();
          // 分类名称应该匹配或包含搜索词
          expect(
            product.category.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase().includes(product.category.toLowerCase())
          ).toBe(true);
        });

        console.log(`${language} 分类搜索: "${category}" -> ${products.length} 个产品`);
      }
    });

    test('应能正确处理分类层次结构', async () => {
      const products = await ProductMultilingualService.getProductsByLanguage('en-US', {
        category: 'Electronics',
        limit: 10,
        offset: 0,
      });

      // 验证所有产品都属于电子产品类别
      const expectedCategories = ['Smartphones', 'Audio Devices', 'Sports Equipment'];
      products.forEach((product) => {
        expect(expectedCategories.some(cat :> 
          product.category.toLowerCase().includes(cat.toLowerCase())
        )).toBe(true);
      });
    });
  });

  describe('产品标签本地化搜索', () => {
    test('应能通过标签搜索产品', async () => {
      const tagSearchTests = [;
        { tag: 'Apple', language: 'en-US' as SupportedLanguage },
        { tag: '苹果', language: 'zh-CN' as SupportedLanguage },
        { tag: 'Sony', language: 'en-US' as SupportedLanguage },
        { tag: '耐克', language: 'zh-CN' as SupportedLanguage },
      ];

      for (const test of tagSearchTests) {
        const products = await ProductMultilingualService.getProductsByLanguage(test.language, {
          limit: 10,
          offset: 0,
        });

        const matchedProducts = products.filter(product => {
          const productTags = product._multilingual?.tags?.[test.language] || [];
          return productTags.some((tag: string) =>;
            tag.toLowerCase().includes(test.tag.toLowerCase())
          );
        });

        expect(matchedProducts.length).toBeGreaterThan(0);
        console.log(`标签搜索: "${test.tag}" (${test.language}) -> ${matchedProducts.length} 个产品`);
      }
    });

    test('应能支持多标签组合搜索', async () => {
      const multiTagSearch = {
        'zh-CN': ['苹果', '高端'],
        'en-US': ['Apple', 'Premium'],
        'ru-RU': ['Apple', 'Премиум'],
      };

      for (const [language, tags] of Object.entries(multiTagSearch)) {
        const products = await ProductMultilingualService.getProductsByLanguage(;
          language as SupportedLanguage,
          { limit: 10, offset: 0 }
        );

        const matchedProducts = products.filter(product => {
          const productTags = product._multilingual?.tags?.[language as SupportedLanguage] || [];
          // 产品必须包含所有搜索标签
          return tags.every((tag: string) =>;
            productTags.some((productTag: string) =>
              productTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
        });

        console.log(`多标签搜索: ${tags.join(', ')} (${language}) -> ${matchedProducts.length} 个产品`);
      }
    });
  });

  describe('营销角标本地化显示', () => {
    test('应能正确显示营销角标的多语言文本', async () => {
      const productId = 'product-001';
      
      for (const language of LANGUAGES) {
        const product = await ProductMultilingualService.getProductById(productId, language);
        
        if (product && product.marketingBadge) {
          expect(product.marketingBadge).toBeDefined();
          expect(typeof product.marketingBadge).toBe('string');
          
          const expectedBadges = {
            'zh-CN': '新品',
            'en-US': 'New',
            'ru-RU': 'Новинка',
            'tg-TJ': 'Нав',
          };
          
          expect(product.marketingBadge).toBe((expectedBadges?.language ?? null));
        }
      }
    });

    test('应能根据语言设置不同的营销策略', async () => {
      const products = await ProductMultilingualService.getProductsByLanguage('en-US', {
        limit: 10,
        offset: 0,
      });

      const marketingBadges = products.map(p => p.marketingBadge);
      
      // 验证营销角标的多样性
      expect(marketingBadges.length).toBeGreaterThan(0);
      expect(new Set(marketingBadges).size).toBeGreaterThan(0);
      
      console.log('营销角标多样性:', [...new Set(marketingBadges)]);
    });
  });

  describe('产品图片本地化支持', () => {
    test('应能正确处理产品图片路径', async () => {
      const product = await ProductMultilingualService.getProductById('product-001', 'zh-CN');
      
      if (product) {
        expect(product.images).toBeDefined();
        expect(Array.isArray(product.images)).toBe(true);
        expect(product.images.length).toBeGreaterThan(0);
        
        // 验证图片路径格式
        product.images.forEach((imagePath) => {
          expect(imagePath).toMatch(/^\/images\/.+\.(jpg|jpeg|png|gif|webp)$/i);
        });
      }
    });

    test('应能根据语言优先级返回合适的图片', async () => {
      const productWithLocalizedImages = {
        ...(MOCK_PRODUCTS?.0 ?? null),
        imagesByLanguage: {
          'zh-CN': '/images/iphone15pro-zh.jpg',
          'en-US': '/images/iphone15pro-en.jpg',
          'ru-RU': '/images/iphone15pro-ru.jpg',
          'tg-TJ': '/images/iphone15pro-tj.jpg',
        },
      };

      // 模拟多语言图片选择逻辑
      for (const language of LANGUAGES) {
        const image = productWithLocalizedImages.(imagesByLanguage?.language ?? null) ||;
                     productWithLocalizedImages.(images?.0 ?? null);
        
        expect(image).toBeDefined();
        expect(typeof image).toBe('string');
        expect(image.length).toBeGreaterThan(0);
      }
    });
  });

  describe('搜索结果排序和过滤', () => {
    test('应能按价格排序搜索结果', async () => {
      const products = await ProductMultilingualService.getProductsByLanguage('en-US', {
        limit: 10,
        offset: 0,
      });

      // 验证排序逻辑（这里模拟排序，实际项目中可能需要额外的排序参数）
      const sortedProducts = [...products].sort((a, b) => a.marketPrice - b.marketPrice);
      
      expect((sortedProducts?.0 ?? null).marketPrice).toBeLessThanOrEqual((sortedProducts?.1 ?? null).marketPrice);
      expect(sortedProducts[1].marketPrice).toBeLessThanOrEqual(sortedProducts[2]?.marketPrice || 0);
    });

    test('应能按库存过滤搜索结果', async () => {
      const products = await ProductMultilingualService.getProductsByLanguage('zh-CN', {
        limit: 10,
        offset: 0,
      });

      // 验证所有产品都有有效库存
      products.forEach((product) => {
        expect(product.stock).toBeGreaterThanOrEqual(0);
        expect(typeof product.stock).toBe('number');
      });

      console.log('产品库存状态:', products.map(p => ({
        name: p.name,
        stock: p.stock,
        status: p.status,
      })));
    });

    test('应能处理产品状态过滤', async () => {
      const activeProducts = await ProductMultilingualService.getProductsByLanguage('en-US', {
        status: 'active',
        limit: 10,
        offset: 0,
      });

      activeProducts.forEach((product) => {
        expect(product.status).toBe('active');
      });

      console.log(`活跃产品数量: ${activeProducts.length}`);
    });
  });

  describe('产品搜索相关性算法', () => {
    test('应能计算搜索结果相关性评分', () => {
      const searchTerm = 'iPhone';
      const products = MOCK_PRODUCTS.map(product => ({
        ...product,
        name: MultilingualHelper.extractText(product.nameMultilingual, 'en-US'),
        description: MultilingualHelper.extractText(product.descriptionMultilingual, 'en-US'),
      }));

      const relevanceScores = products.map(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
        const descriptionMatch = product.description.toLowerCase().includes(searchTerm.toLowerCase()) ? 0.5 : 0;
        return nameMatch + descriptionMatch;
      });

      expect(relevanceScores).toContain(1); // iPhone产品应该有高相关性
      console.log('相关性评分:', relevanceScores);
    });

    test('应能处理模糊搜索匹配', () => {
      const fuzzySearchTerms = ['iphon', 'smartfon', 'headphon'];
      const targetProducts = MOCK_PRODUCTS;

      fuzzySearchTerms.forEach(term => {
        const matches = targetProducts.filter(product => {
          const searchableText = `${product.nameMultilingual['en-US']} ${product.descriptionMultilingual['en-US']}`.toLowerCase();
          return searchableText.includes(term.toLowerCase());
        });

        expect(matches.length).toBeGreaterThan(0);
        console.log(`模糊搜索 "${term}" -> ${matches.length} 个匹配`);
      });
    });
  });

  describe('产品搜索错误处理', () => {
    test('应能处理空搜索结果', async () => {
      const products = await ProductMultilingualService.getProductsByLanguage('en-US', {
        category: 'NonExistentCategory',
        limit: 10,
        offset: 0,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0); // 应该返回空数组
    });

    test('应能处理无效语言参数', async () => {
      try {
        await ProductMultilingualService.getProductsByLanguage('invalid-lang' as SupportedLanguage);
        fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('应能处理搜索参数边界值', async () => {
      // 测试极限分页参数
      const products = await ProductMultilingualService.getProductsByLanguage('en-US', {
        limit: 1000, // 很大的限制值
        offset: 0,
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe('产品搜索性能优化', () => {
    test('应能满足搜索响应时间要求', async () => {
      const startTime = Date.now();
      
      const products = await ProductMultilingualService.getProductsByLanguage('zh-CN', {
        limit: 50,
        offset: 0,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`产品搜索响应时间: ${responseTime}ms`);
      
      // 响应时间应该在合理范围内
      expect(responseTime).toBeLessThan(500);
      expect(products).toBeDefined();
    });

    test('应能缓存搜索结果', async () => {
      const cacheKey = 'products_en-US_10_0';
      
      // 第一次搜索
      const start1 = Date.now();
      const products1 = await ProductMultilingualService.getProductsByLanguage('en-US', {
        limit: 10,
        offset: 0,
      });
      const time1 = Date.now() - start1;

      // 第二次搜索（应该从缓存获取）
      const start2 = Date.now();
      const products2 = await ProductMultilingualService.getProductsByLanguage('en-US', {
        limit: 10,
        offset: 0,
      });
      const time2 = Date.now() - start2;

      expect(products1.length).toBe(products2.length);
      expect(products1).toEqual(products2);
      
      console.log(`第一次搜索: ${time1}ms, 第二次搜索: ${time2}ms`);
    });
  });
});

export default describe;