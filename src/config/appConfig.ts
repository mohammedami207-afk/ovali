import configData from '../../config.json';

/**
 * 👑 ملف الإعدادات العام للمتجر (Central Store Configuration Control Panel)
 * -------------------------------------------------------------------------
 * يستورد كافة القيم ديناميكياً من ملف الإعدادات الموحد 'config.json' في جذر المشروع.
 * يمكنك تعديل 'config.json' لتخصيص المتجر بالكامل لعميل جديد دون لمس الكود المصدري.
 */
export const APP_CONFIG = configData;
