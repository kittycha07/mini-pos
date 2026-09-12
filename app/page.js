'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  // รายการสินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ฟอร์มเพิ่มสินค้าใหม่
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: '',
  });

  // สถานะสำหรับแก้ไขสินค้าแบบ inline (เก็บ id ของแถวที่กำลังแก้ไข และข้อมูลชั่วคราว)
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // ดึงข้อมูลสินค้าตอนโหลดหน้าครั้งแรก
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg('โหลดข้อมูลสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  // จัดการค่าที่พิมพ์ในฟอร์มเพิ่มสินค้าใหม่
  function handleNewProductChange(e) {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  }

  // เพิ่มสินค้าใหม่ลงตาราง products
  async function handleAddProduct(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newProduct.sku || !newProduct.name) {
      setErrorMsg('กรุณากรอก SKU และชื่อสินค้า');
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        sku: newProduct.sku,
        name: newProduct.name,
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock, 10) || 0,
        unit: newProduct.unit,
      },
    ]);

    if (error) {
      setErrorMsg('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setSuccessMsg('เพิ่มสินค้าเรียบร้อยแล้ว');
    setNewProduct({ sku: '', name: '', price: '', stock: '', unit: '' });
    fetchProducts();
  }

  // เริ่มแก้ไขแถวนี้ (ก๊อปข้อมูลเดิมมาใส่ editData)
  function startEdit(product) {
    setEditingId(product.id);
    setEditData({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });
    setErrorMsg('');
    setSuccessMsg('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  // บันทึกการแก้ไขสินค้ากลับไปที่ Supabase
  async function saveEdit(id) {
    setErrorMsg('');
    const { error } = await supabase
      .from('products')
      .update({
        sku: editData.sku,
        name: editData.name,
        price: parseFloat(editData.price) || 0,
        stock: parseInt(editData.stock, 10) || 0,
        unit: editData.unit,
      })
      .eq('id', id);

    if (error) {
      setErrorMsg('แก้ไขสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setSuccessMsg('แก้ไขสินค้าเรียบร้อยแล้ว');
    setEditingId(null);
    fetchProducts();
  }

  // ลบสินค้า
  async function handleDelete(id) {
    const confirmDelete = window.confirm('ต้องการลบสินค้านี้ใช่หรือไม่?');
    if (!confirmDelete) return;

    setErrorMsg('');
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      setErrorMsg('ลบสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setSuccessMsg('ลบสินค้าเรียบร้อยแล้ว');
    fetchProducts();
  }

  return (
    <div>
      <h1>รายการสินค้า</h1>

      {errorMsg && <p className="error-text">{errorMsg}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleAddProduct}>
          <div className="form-row">
            <input
              type="text"
              name="sku"
              placeholder="SKU"
              value={newProduct.sku}
              onChange={handleNewProductChange}
            />
            <input
              type="text"
              name="name"
              placeholder="ชื่อสินค้า"
              value={newProduct.name}
              onChange={handleNewProductChange}
            />
            <input
              type="number"
              name="price"
              placeholder="ราคา"
              step="0.01"
              value={newProduct.price}
              onChange={handleNewProductChange}
            />
            <input
              type="number"
              name="stock"
              placeholder="คงเหลือ"
              value={newProduct.stock}
              onChange={handleNewProductChange}
            />
            <input
              type="text"
              name="unit"
              placeholder="หน่วย เช่น ชิ้น, ขวด"
              value={newProduct.unit}
              onChange={handleNewProductChange}
            />
            <button type="submit">เพิ่มสินค้า</button>
          </div>
        </form>
      </div>

      {/* ตารางแสดงรายการสินค้า */}
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>คงเหลือ</th>
              <th>หน่วย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6}>ยังไม่มีสินค้าในระบบ</td>
              </tr>
            )}
            {products.map((product) => {
              const isEditing = editingId === product.id;
              return (
                <tr key={product.id}>
                  {isEditing ? (
                    <>
                      {/* โหมดแก้ไข: แสดงเป็น input ในแถวเดียวกัน */}
                      <td>
                        <input
                          name="sku"
                          value={editData.sku}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          name="name"
                          value={editData.name}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          value={editData.price}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="stock"
                          value={editData.stock}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          name="unit"
                          value={editData.unit}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <button onClick={() => saveEdit(product.id)}>
                          บันทึก
                        </button>{' '}
                        <button onClick={cancelEdit}>ยกเลิก</button>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* โหมดแสดงผลปกติ */}
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>{Number(product.price).toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.unit}</td>
                      <td>
                        <button onClick={() => startEdit(product)}>
                          แก้ไข
                        </button>{' '}
                        <button onClick={() => handleDelete(product.id)}>
                          ลบ
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
