import { TokoProduct, PembelianDetail } from '../models/index.js';

class TokoProductService {
    async updateStokAfterPembelian(toko_id, pembelian_id) {
        const pembelianDetails = await PembelianDetail.findAll({
            where: { pembelian_id }
        });

        for (const detail of pembelianDetails) {
            const [tokoProduct] = await TokoProduct.findOrCreate({
                where: { 
                    toko_id,
                    product_id: detail.product_id
                },
                defaults: {
                    stok: 0,
                    harga_jual: detail.harga_beli * 1.2 // markup 20%
                }
            });

            await tokoProduct.increment('stok', { by: detail.qty });
        }
    }

    async updateStokAfterPenjualan(toko_id, product_id, qty) {
        const tokoProduct = await TokoProduct.findOne({
            where: { toko_id, product_id }
        });

        if (!tokoProduct || tokoProduct.stok < qty) {
            throw new Error('Stok tidak mencukupi');
        }

        await tokoProduct.decrement('stok', { by: qty });
    }

    async getStok(toko_id, product_id) {
        const tokoProduct = await TokoProduct.findOne({
            where: { toko_id, product_id }
        });
        return tokoProduct?.stok || 0;
    }
}

export default TokoProductService;