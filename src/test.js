async getCombinedReport(req, res) {
    try {
      const toko_id = req.user.toko_id;
      let { startDate, endDate } = req.query;
  
      const startDateTime = new Date(startDate + 'T00:00:00.000+07:00');
      const endDateTime = new Date(endDate + 'T23:59:59.999+07:00');
  
      // 1. Ambil total pembelian langsung dari tabel Pembelian
      const purchaseTotal = await Pembelian.findOne({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total')), 'total_pembelian']
        ],
        where: {
          toko_id,
          tanggal_pembelian: {
            [Op.between]: [startDateTime, endDateTime]
          }
        },
        raw: true
      });
  
      // 2. Ambil data detail pembelian untuk informasi per produk
      const purchaseData = await PembelianDetail.findAll({
        attributes: [
          'product_id',
          [Sequelize.fn('SUM', Sequelize.col('pembelian_detail.qty')), 'total_qty'],
          [Sequelize.literal('pembelian_detail.harga_beli / product.isi'), 'harga_satuan']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_name', 'isi'],
            required: true,
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['category_name']
              }
            ]
          },
          {
            model: Pembelian,
            as: 'pembelian',
            attributes: [],
            where: {
              toko_id,
              tanggal_pembelian: {
                [Op.between]: [startDateTime, endDateTime]
              }
            }
          }
        ],
        group: [
          'product_id', 
          'product.product_id', 
          'product.category.category_id',
          'pembelian_detail.harga_beli',
          'product.isi'
        ],
        raw: true,
        nest: true
      });
  
      // 3. Ambil data penjualan dengan detail produk
      const salesData = await PenjualanDetail.findAll({
        attributes: [
          'product_id',
          [Sequelize.fn('SUM', Sequelize.col('penjualan_detail.qty')), 'total_qty'],
          [Sequelize.fn('SUM', Sequelize.literal('penjualan_detail.qty * penjualan_detail.harga_jual')), 'total_penjualan'],
          [Sequelize.fn('SUM', Sequelize.literal('penjualan_detail.qty * (penjualan_detail.harga_beli / product.isi)')), 'total_hpp']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_name', 'isi'],
            required: true,
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['category_name']
              }
            ]
          },
          {
            model: Penjualan,
            as: 'penjualan',
            attributes: [],
            where: {
              toko_id,
              tanggal_penjualan: {
                [Op.between]: [startDateTime, endDateTime]
              }
            }
          }
        ],
        group: [
          'product_id', 
          'product.product_id', 
          'product.category.category_id'
        ],
        raw: true,
        nest: true
      });
  
      // 4. Gabungkan data per kategori
      const categoryReport = {};
      
      // Proses data pembelian per kategori
      purchaseData.forEach(item => {
        const category = item.product.category.category_name;
        if (!categoryReport[category]) {
          categoryReport[category] = {
            pembelian: { qty: 0, total: 0 },
            penjualan: { qty: 0, total: 0 },
            hpp: 0,
            laba: 0,
            products: []
          };
        }
  
        // Konversi qty pembelian dari dus ke pcs
        const qtyInPcs = parseInt(item.total_qty) * item.product.isi;
        
        // Update qty dalam pcs
        categoryReport[category].pembelian.qty += parseInt(item.total_qty);
  
        // Simpan data produk
        categoryReport[category].products.push({
          nama_produk: item.product.product_name,
          pembelian: {
            qty: qtyInPcs,
            harga_satuan: parseFloat(item.harga_satuan)
          },
          penjualan: { qty: 0, total: 0 },
          hpp: 0,
          laba: 0
        });
      });
  
      // Proses data penjualan per kategori
      salesData.forEach(item => {
        const category = item.product.category.category_name;
        if (!categoryReport[category]) {
          categoryReport[category] = {
            pembelian: { qty: 0, total: 0 },
            penjualan: { qty: 0, total: 0 },
            hpp: 0,
            laba: 0,
            products: []
          };
        }
  
        // Update data penjualan
        categoryReport[category].penjualan.qty += parseInt(item.total_qty);
        categoryReport[category].penjualan.total += parseInt(item.total_penjualan);
        categoryReport[category].hpp += parseInt(item.total_hpp);
        
        // Update product detail
        const productIndex = categoryReport[category].products.findIndex(
          p => p.nama_produk === item.product.product_name
        );
        
        if (productIndex >= 0) {
          categoryReport[category].products[productIndex].penjualan = {
            qty: parseInt(item.total_qty),
            total: parseInt(item.total_penjualan)
          };
          categoryReport[category].products[productIndex].hpp = parseInt(item.total_hpp);
          categoryReport[category].products[productIndex].laba = 
            parseInt(item.total_penjualan) - parseInt(item.total_hpp);
        } else {
          categoryReport[category].products.push({
            nama_produk: item.product.product_name,
            pembelian: { qty: 0 },
            penjualan: {
              qty: parseInt(item.total_qty),
              total: parseInt(item.total_penjualan)
            },
            hpp: parseInt(item.total_hpp),
            laba: parseInt(item.total_penjualan) - parseInt(item.total_hpp)
          });
        }
      });
  
      // Hitung laba per kategori
      Object.keys(categoryReport).forEach(category => {
        categoryReport[category].laba = 
          categoryReport[category].penjualan.total - categoryReport[category].hpp;
      });
  
      // 5. Hitung ringkasan total
      const ringkasan = {
        pembelian: {
          qty: Object.values(categoryReport).reduce((sum, cat) => sum + cat.pembelian.qty, 0),
          total: parseFloat(purchaseTotal.total_pembelian) || 0  // Gunakan total dari tabel pembelian
        },
        penjualan: {
          qty: Object.values(categoryReport).reduce((sum, cat) => sum + cat.penjualan.qty, 0),
          total: Object.values(categoryReport).reduce((sum, cat) => sum + cat.penjualan.total, 0)
        },
        hpp: Object.values(categoryReport).reduce((sum, cat) => sum + cat.hpp, 0),
        laba: Object.values(categoryReport).reduce((sum, cat) => sum + cat.laba, 0)
      };
  
      // Hitung margin dan persentase pencapaian
      ringkasan.margin = ringkasan.hpp > 0 
        ? ((ringkasan.laba / ringkasan.hpp) * 100).toFixed(2)
        : 0;
  
      ringkasan.selisih_pembelian_penjualan = ringkasan.pembelian.total - ringkasan.penjualan.total;
      ringkasan.persentase_pencapaian = ((ringkasan.penjualan.total / ringkasan.pembelian.total) * 100).toFixed(2);
  
      res.json({
        status: "success",
        data: {
          detail_kategori: categoryReport,
          ringkasan,
          periode: {
            tanggal_mulai: startDateTime,
            tanggal_akhir: endDateTime
          }
        }
      });
  
    } catch (error) {
      console.error("Error in getCombinedReport:", error);
      res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }