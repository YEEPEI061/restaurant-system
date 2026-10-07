import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface MenuItem {
  name: string;
  price: number;
  category: string;
  dietary: string[];
  description: string;
  provenance: string;
  pairing: string;
  image: string;
  badges: string[];
  special?: string;
  ingredients: string;
  advisory: string;
}

interface TastingItem {
  name: string;
  price: number;
  id: number;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  activeCategory = 'all';

  activeFilters = new Set<string>();

  searchQuery = '';

  isDietaryModalOpen = false;
  isTastingDrawerOpen = false;

  selectedDish: MenuItem | null = null;

  tastingList: TastingItem[] = [];

  categories = [
    {
      value: 'all',
      label: 'All Creations'
    },
    {
      value: 'crudo',
      label: 'Small Plates & Crudo'
    },
    {
      value: 'hearth',
      label: 'Mains & Hearth'
    },
    {
      value: 'sides',
      label: 'Wood-fired Sides'
    },
    {
      value: 'desserts',
      label: 'Desserts'
    },
    {
      value: 'drinks',
      label: 'Beverages'
    }
  ];

  dietaryFilters = [
    {
      value: 'GF',
      label: 'Gluten-Free [GF]'
    },
    {
      value: 'VG',
      label: 'Vegetarian [VG]'
    },
    {
      value: 'V',
      label: 'Vegan [V]'
    },
    {
      value: 'DF',
      label: 'Dairy-Free [DF]'
    },
    {
      value: 'SPECIAL',
      label: 'Chef Special'
    }
  ];

  menuItems: MenuItem[] = [
    {
      name: 'Charred Hokkaido Scallop',
      price: 28,
      category: 'crudo',
      dietary: ['GF', 'DF', 'SPECIAL'],
      description:
        'Binchotan flash-seared sea scallop, aged yuzu kosho brown butter emulsion, compressed white radish, and fermented sea kelp oil.',
      provenance:
        'Wild Harvest, Shiretoko Peninsula',
      pairing:
        'Citrus & white tea infusion',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBDuhQMi5Izs8oKPNwcmyZEPoTTDNtSP5CxFDc6CNm2k2kDWXQz0lmrf7GkfvLSNoa3JWQyh1-_VHj2PQMh_A2FsJpDnAgNKqJW5_rrS8Fnnc-QzoPXckjJcdx-fvHfm2UHx7C-p0th37PUmH8shCInFvHHGzqq3-LH0uZD4cyFEESIx5_NmsigaGILq2D4lPVSvq7nOLVVJV4wBRlGTRZvHVSsyhlkacmjdgK53P0roiA_1ONKIp54',
      badges: ['GF', 'DF'],
      special: 'Signature',
      ingredients:
        'Hokkaido Sea Scallop, Yuzu Kosho, Unsalted Cultured Butter, Daikon, Kombu Dashi, Sea Salt.',
      advisory:
        'Contains molluscs.'
    },

    {
      name: 'Wagyu Striploin & Marrow Jus',
      price: 64,
      category: 'hearth',
      dietary: ['GF', 'SPECIAL'],
      description:
        '45-day cedar dry-aged Wagyu over cherrywood hearth, smoked bone marrow reduction, black garlic emulsion, and charred spring alliums.',
      provenance:
        'Miyazaki Prefecture, Pure Bloodline',
      pairing:
        'Roasted barley & black tea infusion',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBW3Xwn-JziG5ZB4Qp55lvWU1-kBpESxYzW79XU_R0nzwf568XD8XHxcNv2Osqn1xlgUzT1llQ7F95KmaFfcP9a2NxfUJZx-_ozOZikWTwagSV-h-GtsEgK_c2ZeG9YMJIckyYzazMpHuWelMEFULFT9bgAJmtqEGNMV6sSiUSv0r7ziRRGXGWRB-BQY5-8mROz8x4VKLo6POEicoRSrXllJSXtsADN5Rfcnx8Nc4cu8RJFlWCAAQr6',
      badges: ['GF'],
      special: 'Dry Aged 45d',
      ingredients:
        'Miyazaki Wagyu Beef, Beef Bone Marrow, Black Garlic, Mirin, Cedar Smoke, Spring Allium, Thyme.',
      advisory:
        'Contains allium.'
    },

    {
      name: 'Koji Fermented Maitake',
      price: 24,
      category: 'hearth',
      dietary: ['VG', 'V', 'DF', 'GF'],
      description:
        'Hearth-roasted wild Hen of the Woods mushroom, house-fermented barley koji glaze, roasted sunchoke puree, and crisp sunflower seed crunch.',
      provenance:
        'Fyn Forest Forage, Denmark',
      pairing:
        'Jasmine green tea with toasted herbs',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBhv4ydzEARlEiuYPWz-ed5tgFP2L8IIeJZAG4K1zXdUV4AGRBVYCjXSMe8axUczMTj06_NQRubYF9EhfU3sb2Nue6fe3h8-xzp-NNFQD3a41gOsIfnKgEP-qjOY9GZ0n55TQ-xZ6Xmr77XhzTljqNzaMwYEj6d2YVBzFwASOpk2HpTJdaQRBEr8sLYlFYHA7hpzZLGUPtM68__gzafoJd9WFM96TDj5rF5OQoCSKR1J4lozCBJfzyX',
      badges: ['VG', 'V', 'GF'],
      special: 'Plant Forward',
      ingredients:
        'Wild Maitake Mushrooms, Rice Koji, Sunchokes, Cold-pressed Rapeseed Oil, Sunflower Seeds, Sea Salt.',
      advisory:
        'Zero common allergens.'
    },

    {
      name: 'Hardanger Fjord Trout',
      price: 26,
      category: 'crudo',
      dietary: ['GF', 'DF'],
      description:
        'Quick-cured glacier trout, mountain sea buckthorn coulis, extracted spruce needle oil, and wild fennel pollen crisp.',
      provenance:
        'Hardangerfjord, Cold Currents',
      pairing:
        'Apple, cucumber & dill tonic',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD8CPYXYIZ4Bd2aLFBUppf_DlBJOCwKpZ12spLztCmkgAsXf_7s2jgXqH51YHPVjF-YUweX_DgDpR7fadGknfETtHqWPCK_n0_UYl77OD3Wu5lWIJ-Yr1cvzTy4hKb9TNVZiAmZjH6TFqkrk_KMvl4mo9_JvMufn3cDBHt4Wq2xIRhC_ZfFsKmI5An--NmU76DFI3L8Pm5Ws8ZuAeyLXnZ2tj0VCQ5LVh1netrlXrCU6YmbHIIciB-l',
      badges: ['GF', 'DF'],
      ingredients:
        'Glacier Trout, Sea Buckthorn, Spruce Oil, Fennel Pollen, Apple Cider Vinegar, Flake Sea Salt.',
      advisory:
        'Contains finfish.'
    },

    {
        name: 'Ember-Buried Sweet Leeks',
        price: 16,
        category: 'sides',
        dietary: ['VG', 'GF', 'V', 'DF'],
        description:
          'Charred directly in ash coals, dressed with toasted sesame vinaigrette, shiso oil, and puffed barley pearls.',
        provenance:
          'Søtofte Kurvegård Organic Farm',
        pairing:
          'Shiso, cucumber & citrus cooler',
        image:
          'https://lh3.googleusercontent.com/aida/AEtjO1WOo-okVq_ntoLByKr2S0Gx8rfLqsPtfqWcuFTVBf7y3m4tJkhTwi49wsLAnnosqMk56ut19uk3hyVg-MfziPipwjcObpHyabsBEEmJDfoV6X6iqgjjbsK5zZSIL--YjYRIFV_3MtfejWjbDnk-1KHi2LMz7EpJ31RK08gHSMtC7Hg7SC8AO25rCsluO4OMZhZ5ynqn31KcuLb8udgeAXxSXYi6uboxyttS7rTchYzHCnCU6X_nPWHRd9Y',
        badges: ['VG', 'GF', 'V'],
        ingredients:
          'Heirloom Leeks, Roasted Sesame Oil, White Soy, Green Shiso, Puffed Barley.',
        advisory:
          'Contains sesame and gluten traces in puffed barley.'
      },

    {
      name: 'Blood Orange & Olive Oil Panna Cotta',
      price: 18,
      category: 'desserts',
      dietary: ['GF', 'VG', 'SPECIAL'],
      description:
        'Cultured buttermilk panna cotta, Moro blood orange granita, early-harvest olive oil, and crystalline sea salt.',
      provenance:
        'Mount Etna Moro Oranges, Sicily',
      pairing:
        'Blood orange & rosemary spritz',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDkI0WJYS0g4KS5sBFiE-4LftTnTm77T1jxS2BYHycs2dnBtIbIuftKBnmpl6bOKopKmnvLVGSuKQ7dUCCvdbzyOZA0iso2HOYTcmbGwlq73IsJzBwJsxgvmH-04eH_4pmyQXA_60Zn8nyrShfpjgVOJlGHXf33tMqrhPkKu0zBThpkPpkUDbx4qcWmLtcLR3NOHhU6ej00gme6fI64NeV6WdZeWfkSrjXlHzOY5ajYjDkS17F_rQaG',
      badges: ['GF', 'VG'],
      special: 'Pastry Studio',
      ingredients:
        'Jersey Cow Buttermilk, Double Cream, Moro Blood Orange, Sicilian Extra Virgin Olive Oil, Organic Cane Sugar, Gelatin.',
      advisory:
        'Contains dairy.'
    },

    {
      name: 'Hinoki Forest Cooler',
      price: 16,
      category: 'drinks',
      dietary: ['VG', 'V', 'DF', 'GF'],
      description:
        'Meyer lemon cordial, cedarwood hydrosol, aged plum infusion, sparkling water, and charred cypress aroma.',
      provenance:
        'Japanese Hinoki & Seasonal Citrus',
      pairing:
        'Resinous, tart smoke, velvet',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCCX7S9wtY18WtI801LqQwet2cT0U9U-Bkzyorm6k-JihmfEMs-xFkj5dr7DMNqAebih8Et__vXj8QGrRCZ6QaxRSZ-eOZVSuR9k_A8gkKu41oRugYH6_3L42B5UyZtnahW2ubRpr97yyqBZAM654N9oD15exOr3xbPDO3S3lzxLxXK22AVNzdXwvzTNDKmG3MqAAeB0HI9YjrdYr6yF1T_v1t9OllUoBd8tK6vsgBEKTjwQn85jyTA',
      badges: ['V', 'GF'],
      special: 'Apothecary Bar',
      ingredients:
        'Cedar Hydrosol, Meyer Lemon, Plum Infusion, Hinoki Aroma, Sparkling Water.',
      advisory:
        'Zero common allergens.'
    },

    {
      name: 'Smoked Birch Potato Mousseline',
      price: 14,
      category: 'sides',
      dietary: ['VG', 'GF'],
      description:
        'Danish Ratte potatoes whipped with birch-smoked cream, cultured butter, fresh wild chive oil, and dehydrated skin crisps.',
      provenance:
        'Samsø Island Sandy Soils',
      pairing:
        'Roasted barley & herb tea',
      image:
        'https://lh3.googleusercontent.com/aida/AEtjO1Xmk12hIwd23fgozT4s2IUfVhSxe0kVc00CKzwtF7NFLQPyNAupVvWKO1r8ZaIjmriszXf12i-9Ko6-kxtFXmqbqouPH85jV4WCxOZm7U48ZJOocKNUcx_OxVGDweAnADNwadKp8OsVXUhHOlJQ4NM6ZMlKPj0xCeZ2KBUvt6WMTdTBppFr--DT7n670bdLcWgExt_xwu6osDCWtt4tDMk2kvTgblZqcj7tK0h-UmrjMgaU1KztErSyYzg',
      badges: ['VG', 'GF'],
      ingredients:
        'Ratte Potatoes, Cultured Butter, Birch Smoked Cream, Chives, Flake Salt.',
      advisory:
        'Contains dairy.'
    }
  ];

  get filteredItems(): MenuItem[] {
    const query = this.searchQuery.toLowerCase().trim();

    return this.menuItems.filter(item => {

      const categoryMatch =
        this.activeCategory === 'all' ||
        item.category === this.activeCategory;

      const dietaryMatch =
        this.activeFilters.size === 0 ||
        [...this.activeFilters].every(filter =>
          item.dietary.includes(filter)
        );

      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.provenance.toLowerCase().includes(query);

      return categoryMatch && dietaryMatch && searchMatch;
    });
  }

  get tastingTotal(): number {
    return this.tastingList.reduce(
      (total, item) => total + item.price,
      0
    );
  }

  selectCategory(category: string): void {
    this.activeCategory = category;
  }

  toggleDietaryFilter(filter: string): void {
    if (this.activeFilters.has(filter)) {
      this.activeFilters.delete(filter);
    } else {
      this.activeFilters.add(filter);
    }
  }

  isFilterActive(filter: string): boolean {
    return this.activeFilters.has(filter);
  }

  addToTasting(item: MenuItem): void {
    this.tastingList.push({
      name: item.name,
      price: item.price,
      id: Date.now() + Math.random()
    });

    this.openTastingDrawer();
  }

  selectTastingMenu(type: '5-course' | '7-course'): void {

    if (type === '5-course') {
      this.tastingList.push({
        name: '5-Course Prelude Tasting Menu',
        price: 125,
        id: Date.now() + Math.random()
      });
    } else {
      this.tastingList.push({
        name: '7-Course Odyssey Tasting Menu',
        price: 175,
        id: Date.now() + Math.random()
      });
    }

    this.openTastingDrawer();
  }

  removeFromTasting(id: number): void {
    this.tastingList =
      this.tastingList.filter(item => item.id !== id);
  }

  openDietaryModal(item: MenuItem): void {
    this.selectedDish = item;
    this.isDietaryModalOpen = true;
  }

  closeDietaryModal(): void {
    this.isDietaryModalOpen = false;
    this.selectedDish = null;
  }

  openTastingDrawer(): void {
    this.isTastingDrawerOpen = true;
  }

  closeTastingDrawer(): void {
    this.isTastingDrawerOpen = false;
  }

  trackByName(index: number, item: MenuItem): string {
    return item.name;
  }
}