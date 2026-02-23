import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Auth
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      loginSubtitle: 'Access your lists and fair activity.',
      registerSubtitle: 'Create your fair account in minutes.',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      
      // Navigation
      appTitle: 'Book Fair',
      appSubtitle: 'International Catalog',
      myLists: 'My Lists',
      books: 'Books',
      publishers: 'Publishers',
      orders: 'Orders',
      adminView: 'Admin View',
      
      // Lists
      createList: 'Create List',
      listName: 'List Name',
      description: 'Description',
      makePublic: 'Make Public',
      addBook: 'Add Book',
      mergeLists: 'Merge Lists',
      
      // Books
      title: 'Title',
      author: 'Author',
      isbn: 'ISBN',
      publisher: 'Publisher',
      price: 'Price',
      originalPrice: 'Original Price',
      actualPrice: 'Actual Price',
      discount: 'Discount',
      category: 'Category',
      booth: 'Booth',
      hall: 'Hall',
      
      // Status
      status: 'Status',
      want: 'Want',
      maybe: 'Maybe',
      thinking: 'Thinking',
      cancel: 'Cancel',
      searching: 'Searching',
      found: 'Found',
      purchased: 'Purchased',
      pending: 'Pending',
      shipped: 'Shipped',
      delivered: 'Delivered',
      
      // Priority
      priority: 'Priority',
      
      // Actions
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      update: 'Update',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      clearFilters: 'Clear Filters',
      searchPlaceholder: 'Search by title, author, or ISBN',
      all: 'All',
      minPrice: 'Min price',
      maxPrice: 'Max price',
      lookInside: 'Look Inside',
      quickView: 'Quick View',
      noResults: 'No books match your filters yet.',
      loadMore: 'Load More',
      preview: 'Preview',
      previewPlaceholder: 'Preview pages will appear here when available.',
      close: 'Close',
      public: 'Public',
      private: 'Private',
      selectListFirst: 'Please select a list first',
      
      // Orders
      createOrder: 'Create Order',
      totalPrice: 'Total Price',
      shippingStatus: 'Shipping Status',
      
      // Common
      notes: 'Notes',
      actions: 'Actions',
      user: 'User',
      admin: 'Admin',
    }
  },
  ar: {
    translation: {
      // Auth
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      loginSubtitle: 'الوصول إلى قوائمك وأنشطة المعرض.',
      registerSubtitle: 'أنشئ حسابك في دقائق.',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      name: 'الاسم',
      
      // Navigation
      appTitle: 'معرض الكتاب',
      appSubtitle: 'كتالوج دولي',
      myLists: 'قوائمي',
      books: 'الكتب',
      publishers: 'الناشرون',
      orders: 'الطلبات',
      adminView: 'عرض المسؤول',
      
      // Lists
      createList: 'إنشاء قائمة',
      listName: 'اسم القائمة',
      description: 'الوصف',
      makePublic: 'جعلها عامة',
      addBook: 'إضافة كتاب',
      mergeLists: 'دمج القوائم',
      
      // Books
      title: 'العنوان',
      author: 'المؤلف',
      isbn: 'الرقم الدولي',
      publisher: 'الناشر',
      price: 'السعر',
      originalPrice: 'السعر الأصلي',
      actualPrice: 'السعر الفعلي',
      discount: 'الخصم',
      category: 'الفئة',
      booth: 'الجناح',
      hall: 'القاعة',
      
      // Status
      status: 'الحالة',
      want: 'أريد',
      maybe: 'ربما',
      thinking: 'أفكر',
      cancel: 'إلغاء',
      searching: 'بحث',
      found: 'تم العثور',
      purchased: 'تم الشراء',
      pending: 'قيد الانتظار',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      
      // Priority
      priority: 'الأولوية',
      
      // Actions
      save: 'حفظ',
      edit: 'تعديل',
      delete: 'حذف',
      update: 'تحديث',
      create: 'إنشاء',
      search: 'بحث',
      filter: 'تصفية',
      clearFilters: 'مسح الفلاتر',
      searchPlaceholder: 'ابحث بالعنوان أو المؤلف أو الرقم الدولي',
      all: 'الكل',
      minPrice: 'أقل سعر',
      maxPrice: 'أعلى سعر',
      lookInside: 'تصفح الكتاب',
      quickView: 'عرض سريع',
      noResults: 'لا توجد كتب مطابقة للفلاتر.',
      loadMore: 'تحميل المزيد',
      preview: 'معاينة',
      previewPlaceholder: 'ستظهر صفحات المعاينة هنا عند توفرها.',
      close: 'إغلاق',
      public: 'عام',
      private: 'خاص',
      selectListFirst: 'يرجى اختيار قائمة أولاً',
      
      // Orders
      createOrder: 'إنشاء طلب',
      totalPrice: 'السعر الإجمالي',
      shippingStatus: 'حالة الشحن',
      
      // Common
      notes: 'ملاحظات',
      actions: 'الإجراءات',
      user: 'مستخدم',
      admin: 'مسؤول',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
