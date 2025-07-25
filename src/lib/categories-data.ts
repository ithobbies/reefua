export type Subcategory = {
  name: string;
  slug: string;
};

export type Category = {
  name:string;
  slug: string;
  subcategories: Subcategory[];
};

export const productCategories: Category[] = [
  {
    name: 'Живність',
    slug: 'livestock',
    subcategories: [
      { name: 'Риба', slug: 'fish' },
      { name: 'Безхребетні', slug: 'invertebrates' },
    ],
  },
  {
    name: 'Корали',
    slug: 'corals',
    subcategories: [
      { name: "М'які", slug: 'soft' },
      { name: 'LPS', slug: 'lps' },
      { name: 'SPS', slug: 'sps' },
      { name: 'Анемони', slug: 'anemones' },
    ],
  },
  // В будущем сюда можно легко добавить новые категории
  // {
  //   name: 'Обладнання',
  //   slug: 'equipment',
  //   subcategories: [
  //     { name: 'Скімери', slug: 'skimmers' },
  //     { name: 'Насоси', slug: 'pumps' },
  //   ],
  // },
];
