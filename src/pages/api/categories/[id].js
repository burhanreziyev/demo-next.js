// pages/api/categories/[id].js
import {PrismaClient} from '@prisma/client';
import multer from 'multer';
import {uploadFile, deleteFile} from '@/utils/fileManager';

const prisma = new PrismaClient();

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

export const config = {
    api: {
        bodyParser: false,
    },
};

const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};

export default async function handler(req, res) {
    const {id} = req.query;

    if (req.method === 'GET') {
        // Belirli bir kategoriyi getir
        try {
            const category = await prisma.category.findUnique({
                where: {id: parseInt(id)},
            });
            if (!category) {
                return res.status(404).json({error: 'Kategori bulunamadı.'});
            }
            res.status(200).json(category);
        } catch (error) {
            console.error('Kategori alınırken hata oluştu:', error);
            res.status(500).json({error: 'Kategori alınırken hata oluştu.'});
        }
    } else if (req.method === 'PUT') {
        // Kategori güncelle
        await runMiddleware(req, res, upload.single('image'));

        try {
            const {name, description} = JSON.parse(req.body.data);

            const existingCategory = await prisma.category.findUnique({
                where: {id: parseInt(id)},
            });

            if (!existingCategory) {
                return res.status(404).json({error: 'Kategori bulunamadı.'});
            }

            let imageUrl = existingCategory.imageUrl;

            if (req.file) {
                const oldFileName = imageUrl ? imageUrl.split('/').pop() : null;
                if (oldFileName) await deleteFile(oldFileName);

                imageUrl = await uploadFile({
                    originalFilename: req.file.originalname,
                    buffer: req.file.buffer,
                });
            }

            const updatedCategory = await prisma.category.update({
                where: {id: parseInt(id)},
                data: {
                    name,
                    description,
                    imageUrl,
                },
            });

            res.status(200).json(updatedCategory);
        } catch (error) {
            console.error('Kategori güncellenirken hata oluştu:', error);
            res.status(500).json({error: 'Kategori güncellenirken hata oluştu.'});
        }
    } else if (req.method === 'DELETE') {
        // Kategori sil
        try {
            const existingCategory = await prisma.category.findUnique({
                where: {id: parseInt(id)},
            });

            if (!existingCategory) {
                return res.status(404).json({error: 'Kategori bulunamadı.'});
            }

            if (existingCategory.imageUrl) {
                const fileName = existingCategory.imageUrl.split('/').pop();
                await deleteFile(fileName);
            }

            await prisma.category.delete({
                where: {id: parseInt(id)},
            });

            res.status(204).end();
        } catch (error) {
            console.error('Kategori silinirken hata oluştu:', error);
            res.status(500).json({error: 'Kategori silinirken hata oluştu.'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
