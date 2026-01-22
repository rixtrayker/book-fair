import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Auth
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      
      // Navigation
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
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      name: 'الاسم',
      
      // Navigation
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
