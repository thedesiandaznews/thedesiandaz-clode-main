'use client';

import React, { useState } from 'react';
import styles from '../admin.module.css';
import { addCategory, deleteCategory, updateCategory, seedDefaultCategoriesAction } from '@/actions/categories';

export default function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
  const [newCatName, setNewCatName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await addCategory(newCatName.trim());
    if (res.success) {
      setNewCatName('');
    } else {
      alert(res.message);
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await updateCategory(editId, editName.trim());
    if (res.success) {
      setEditId(null);
      setEditName('');
    } else {
      alert(res.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete category "${name}"? This may affect existing articles.`)) {
      await deleteCategory(id);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-tags" style={{ color: '#ef4444' }}></i>
            <span>Category Management</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Establish article categories, structure news classification, and configure publishing sections.
          </p>
        </div>
        <button 
          onClick={async () => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              const res = await seedDefaultCategoriesAction();
              if (res.success) {
                alert(`Successfully restored default categories in Hindi!`);
                window.location.reload();
              } else {
                alert('Failed to seed categories: ' + res.message);
              }
            } catch (err) {
              console.error('Error seeding:', err);
            } finally {
              setIsSubmitting(false);
            }
          }} 
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #cbd5e1',
            color: '#334155',
            padding: '10px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#94a3b8';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <i className="fas fa-seedling" style={{ color: '#10b981' }}></i> Seed Hindi Defaults
        </button>
      </div>

      <div className={styles.categoriesGrid}>
        {/* Add/Edit Category Form */}
        <div style={{ 
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)',
          alignSelf: 'start'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-plus-circle" style={{ color: '#4f46e5' }}></i>
            <span>{editId ? 'Edit Category' : 'Create Category'}</span>
          </h3>
          
          <form onSubmit={editId ? handleUpdate : handleAdd}>
            <div className={styles.formGroup}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Category Name Label
              </label>
              <input 
                type="text" 
                className={styles.formInput} 
                style={{ 
                  borderRadius: '10px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '14px', 
                  background: '#f8fafc',
                  padding: '12px 16px',
                  fontWeight: 500
                }}
                placeholder="e.g. Technology" 
                value={editId ? editName : newCatName}
                onChange={(e) => editId ? setEditName(e.target.value) : setNewCatName(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                style={{ 
                  flex: 1, 
                  justifyContent: 'center', 
                  opacity: isSubmitting ? 0.7 : 1,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
                }}
              >
                <i className={editId ? "fas fa-check" : "fas fa-save"}></i> 
                <span>{editId ? 'Update Section' : 'Create Category'}</span>
              </button>
              
              {editId && (
                <button 
                  type="button" 
                  onClick={() => setEditId(null)} 
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
          <div style={{ 
            background: '#ffffff', 
            padding: '16px 24px', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span>Classification Directories</span>
            </div>
            <span style={{ 
              background: '#ecfdf5', 
              color: '#10b981', 
              fontSize: '12px', 
              fontWeight: 800, 
              padding: '4px 12px', 
              borderRadius: '20px' 
            }}>
              {initialCategories.length} Active sections
            </span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Category Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold', width: '140px', textAlign: 'center' }}>Evaluation Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialCategories.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ 
                      textAlign: 'center', 
                      padding: '40px', 
                      color: '#64748b',
                      background: '#ffffff',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px'
                    }}>
                      No categories found. Click 'Seed Defaults' to load standard categories.
                    </td>
                  </tr>
                ) : (
                  initialCategories.map((cat) => (
                    <tr key={cat.id} style={{
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                      borderRadius: '10px',
                      transition: 'all 0.2s',
                    }}>
                      <td style={{ 
                        padding: '14px 16px', 
                        borderTopLeftRadius: '10px', 
                        borderBottomLeftRadius: '10px', 
                        border: '1px solid #e2e8f0', 
                        borderRight: 'none',
                        verticalAlign: 'middle',
                        fontWeight: 700, 
                        color: '#1e293b', 
                        fontSize: '14.5px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-folder-open" style={{ color: '#cbd5e1' }}></i>
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 16px', 
                        borderTopRightRadius: '10px', 
                        borderBottomRightRadius: '10px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: 'none',
                        verticalAlign: 'middle',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => {
                              setEditId(cat.id);
                              setEditName(cat.name);
                            }} 
                            title="Edit Category Name"
                            style={{ 
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: 'none',
                              color: '#4f46e5', 
                              background: '#eeebff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#4f46e5';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#eeebff';
                              e.currentTarget.style.color = '#4f46e5';
                            }}
                          >
                            <i className="fas fa-edit" style={{ fontSize: '12px' }}></i>
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(cat.id, cat.name)} 
                            title="Delete Category Section"
                            style={{ 
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: 'none',
                              color: '#ef4444', 
                              background: '#fff5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff5f5';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
