import { BriefcaseBusiness, Landmark, UsersRound, WalletCards } from 'lucide-react';

export const GOV_SECTIONS = [
  {
    to: '/government-jobs',
    titleEn: 'Government Jobs',
    titleUr: 'سرکاری نوکریاں',
    descriptionEn: 'Browse government vacancies and their official application information.',
    descriptionUr: 'سرکاری آسامیوں اور درخواست دینے کی سرکاری معلومات دیکھیں۔',
    icon: BriefcaseBusiness,
  },
  {
    to: '/government-schemes',
    titleEn: 'Government Schemes',
    titleUr: 'سرکاری اسکیمیں',
    descriptionEn: 'Explore public support programmes, benefits and eligibility details.',
    descriptionUr: 'عوامی امدادی پروگرام، فوائد اور اہلیت کی تفصیلات دیکھیں۔',
    icon: WalletCards,
  },
  {
    to: '/local-authorities',
    titleEn: 'Local Authorities',
    titleUr: 'مقامی سرکاری ادارے',
    descriptionEn: 'Find local government offices, departments and public contact points.',
    descriptionUr: 'مقامی سرکاری دفاتر، محکموں اور عوامی رابطہ مراکز کی معلومات حاصل کریں۔',
    icon: Landmark,
  },
  {
    to: '/authority-profiles',
    titleEn: 'Authority Profiles',
    titleUr: 'سرکاری شخصیات کے پروفائلز',
    descriptionEn: 'View public profiles of office-holders and local representatives.',
    descriptionUr: 'عوامی عہدیداروں اور مقامی نمائندوں کے تعارفی پروفائل دیکھیں۔',
    icon: UsersRound,
  },
] as const;
