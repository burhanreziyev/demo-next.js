// pages/api/categories/index.js
import {PrismaClient} from '@prisma/client';
import multer from 'multer';
import {uploadFile} from '@/utils/fileManager';

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
    if (req.method === 'GET') {
        // Tüm kategorileri getir
        try {
            const categories = await prisma.category.findMany();
            res.status(200).json(categories);
        } catch (error) {
            console.error('Kategoriler alınırken hata oluştu:', error);
            res.status(500).json({error: 'Kategoriler alınırken hata oluştu.'});
        }
    } else if (req.method === 'POST') {
        await runMiddleware(req, res, upload.single('image'));

        try {
            const {name, description} = JSON.parse(req.body.data);
            let imageUrl = null;

            if (req.file) {
                imageUrl = await uploadFile({
                    originalFilename: req.file.originalname,
                    buffer: req.file.buffer,
                });
            }

            const category = await prisma.category.create({
                data: {
                    name,
                    description,
                    imageUrl,
                },
            });

            res.status(201).json(category);
        } catch (error) {
            console.error('Kategori oluşturulurken hata oluştu:', error);
            res.status(500).json({error: 'Kategori oluşturulurken hata oluştu.'});
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
