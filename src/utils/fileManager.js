// utils/fileManager.js
import * as Minio from 'minio';

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minio',
    secretKey: 'minio@123',
});

const bucketName = 'ecommerce';

export const uploadFile = async (file) => {
    // Dosya adını düzenle
    const sanitizedFilename = file.originalFilename
        .toLowerCase()                                  // Tüm harfleri küçük harfe çevir
        .replace(/\s+/g, '-')                           // Boşlukları '-' ile değiştir
        .replace(/[^a-z0-9\.\-]/g, '');                 // Özel karakterleri kaldır, yalnızca harf, sayı, nokta ve tire bırak
    const objectName = `${Date.now()}_${sanitizedFilename}`; // Zaman damgası ekleyerek benzersiz hale getir

    // Bucket var mı kontrol et, yoksa oluştur
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
        await minioClient.makeBucket(bucketName);
    }

    // Dosyayı MinIO'ya yükle
    await minioClient.putObject(bucketName, objectName, file.buffer);

    // Yüklenen dosyanın URL'sini döndür
    return `http://localhost:9000/${bucketName}/${objectName}`;
};

export const deleteFile = async (fileName) => {
    try {
        await minioClient.removeObject(bucketName, fileName);
    } catch (error) {
        throw new Error('Dosya silinirken hata oluştu.');
    }
};
