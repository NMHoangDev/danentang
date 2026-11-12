import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AdminLoginResponse,
  createGiangVien,
  deleteGiangVien,
  getGiangVienList,
  getTeacherStats,
  GiangVienItem,
  loginAdmin,
  TeacherStats,
  updateGiangVien,
} from './src/features/giangvien/api/giangvien-api';
import { getActiveApiBaseUrl, setCustomApiBaseUrl } from './src/lib/api-client';

// Danh sách ảnh mẫu avatar giảng viên chất lượng cao để chọn nhanh
const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
];

export default function App(): React.JSX.Element {
  // Trạng thái Admin Auth
  const [adminUser, setAdminUser] = useState<AdminLoginResponse['user'] | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Trạng thái Quản Lý Giảng Viên
  const [teachers, setTeachers] = useState<GiangVienItem[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NONE' | 'SUMCLASS_DESC' | 'SUMCLASS_ASC'>('NONE');

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formIDGV, setFormIDGV] = useState('');
  const [formFullname, setFormFullname] = useState('');
  const [formImage, setFormImage] = useState(SAMPLE_AVATARS[0]);
  const [formSumClass, setFormSumClass] = useState('1');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Xác nhận Xóa
  const [deletingItem, setDeletingItem] = useState<GiangVienItem | null>(null);

  // Banner thông báo
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Tải danh sách & thống kê
  const loadData = useCallback(async (search = searchQuery) => {
    setLoading(true);
    try {
      const [list, statData] = await Promise.all([
        getGiangVienList(search),
        getTeacherStats(),
      ]);
      setTeachers(list);
      setStats(statData);
    } catch (err: any) {
      showToast('error', `Lỗi tải dữ liệu: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (adminUser) {
      void loadData();
    }
  }, [adminUser, loadData]);

  // Xử lý Đăng nhập Admin
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setAuthError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await loginAdmin(username, password);
      setAdminUser(res.user);
      showToast('success', `Chào mừng ${res.user.displayName}!`);
    } catch (err: any) {
      setAuthError(err.message || 'Đăng nhập thất bại. Thử admin / admin123');
    } finally {
      setAuthLoading(false);
    }
  };

  // Mở modal Thêm mới
  const openCreateModal = () => {
    setEditingId(null);
    setFormIDGV(`GV${Math.floor(100 + Math.random() * 900)}`);
    setFormFullname('');
    setFormImage(SAMPLE_AVATARS[Math.floor(Math.random() * SAMPLE_AVATARS.length)]);
    setFormSumClass('4');
    setIsModalOpen(true);
  };

  // Mở modal Sửa
  const openEditModal = (item: GiangVienItem) => {
    setEditingId(item.IDGV);
    setFormIDGV(item.IDGV);
    setFormFullname(item.Fullname);
    setFormImage(item.Image);
    setFormSumClass(String(item.SumClass));
    setIsModalOpen(true);
  };

  // Lưu Form Thêm / Sửa
  const handleSaveForm = async () => {
    if (!formIDGV.trim()) {
      showToast('error', 'Mã Giảng viên (IDGV) không được để trống!');
      return;
    }
    if (!formFullname.trim()) {
      showToast('error', 'Họ và tên (Fullname) không được để trống!');
      return;
    }
    const numClass = parseInt(formSumClass, 10);
    if (isNaN(numClass) || numClass < 0) {
      showToast('error', 'Tổng số lớp (SumClass) phải là số >= 0!');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingId) {
        // Sửa
        const updated = await updateGiangVien(editingId, {
          Fullname: formFullname.trim(),
          Image: formImage.trim(),
          SumClass: numClass,
        });
        setTeachers((prev) => prev.map((item) => (item.IDGV === editingId ? updated : item)));
        showToast('success', `Đã cập nhật thông tin giảng viên ${updated.IDGV}!`);
      } else {
        // Thêm mới
        const created = await createGiangVien({
          IDGV: formIDGV.trim().toUpperCase(),
          Fullname: formFullname.trim(),
          Image: formImage.trim(),
          SumClass: numClass,
        });
        setTeachers((prev) => [created, ...prev]);
        showToast('success', `Đã thêm giảng viên ${created.Fullname} (${created.IDGV})!`);
      }
      setIsModalOpen(false);
      void loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi lưu thông tin giảng viên');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Xóa Giảng viên
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteGiangVien(deletingItem.IDGV);
      setTeachers((prev) => prev.filter((item) => item.IDGV !== deletingItem.IDGV));
      showToast('success', `Đã xóa giảng viên ${deletingItem.Fullname} (${deletingItem.IDGV}) khỏi CSDL!`);
      setDeletingItem(null);
      void loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi xóa giảng viên');
    }
  };

  // Xuất file CSDL JSON nộp bài
  const handleExportDatabase = () => {
    if (Platform.OS === 'web') {
      window.open(`${getActiveApiBaseUrl()}/giangvien/export`, '_blank');
      showToast('success', 'Đang tải file CSDL QLHocPhan_GiangVien.json...');
    } else {
      showToast('success', 'File CSDL đã được lưu trữ sẵn tại root dự án: QLHocPhan_GiangVien.json');
    }
  };

  // Lọc và sắp xếp danh sách
  const displayTeachers = [...teachers].sort((a, b) => {
    if (sortBy === 'SUMCLASS_DESC') return b.SumClass - a.SumClass;
    if (sortBy === 'SUMCLASS_ASC') return a.SumClass - b.SumClass;
    return a.IDGV.localeCompare(b.IDGV);
  });

  // MÀN HÌNH 1: ĐĂNG NHẬP ADMIN (NẾU CHƯA ĐĂNG NHẬP)
  if (!adminUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="light" />
        <View style={styles.authCard}>
          <View style={styles.authBadge}>
            <Text style={styles.authBadgeText}>HỆ THỐNG QUẢN LÝ HỌC PHẦN</Text>
          </View>
          <Text style={styles.authTitle}>Phân Hệ Admin</Text>
          <Text style={styles.authSubtitle}>
            Đăng nhập để quản lý Collection Giảng Viên (IDGV, Fullname, Image, SumClass) trong CSDL QLHocPhan
          </Text>

          {Boolean(authError) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {authError}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>Tên tài khoản</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="admin"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
          />

          <Pressable
            style={[styles.primaryBtn, authLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Đăng Nhập Vào Hệ Thống</Text>
            )}
          </Pressable>

          <View style={styles.authFooter}>
            <Text style={styles.authHint}>Tài khoản mẫu: <Text style={styles.boldText}>admin</Text> | Mật khẩu: <Text style={styles.boldText}>admin123</Text></Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // MÀN HÌNH 2: DASHBOARD QUẢN LÝ GIẢNG VIÊN (PHÂN HỆ ADMIN)
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Toast Notification */}
        {toast && (
          <View style={[styles.toastContainer, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Text style={styles.toastText}>{toast.type === 'success' ? '✓' : '⚠️'} {toast.message}</Text>
          </View>
        )}

        {/* Header Bar */}
        <View style={styles.topNavbar}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandLogoBox}><Text style={styles.brandLogoText}>QL</Text></View>
              <Text style={styles.navTitle}>QLHocPhan</Text>
              <View style={styles.adminTag}><Text style={styles.adminTagText}>ADMIN PANEL</Text></View>
            </View>
            <Text style={styles.navSub}>Quản lý Giảng viên trong CSDL Học Phần</Text>
          </View>
          <View style={styles.userProfileRow}>
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>AD</Text></View>
            <View style={styles.desktopOnly}>
              <Text style={styles.userName}>{adminUser.displayName}</Text>
              <Text style={styles.userRole}>Super Admin</Text>
            </View>
            <Pressable style={styles.logoutBtn} onPress={() => setAdminUser(null)}>
              <Text style={styles.logoutBtnText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>

        {/* Thống kê Bento Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TỔNG SỐ GIẢNG VIÊN</Text>
            <Text style={styles.statValue}>{stats?.totalTeachers ?? teachers.length}</Text>
            <Text style={styles.statSub}>Đang hoạt động trong CSDL</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TỔNG SỐ LỚP HỌC</Text>
            <Text style={styles.statValue}>{stats?.totalClasses ?? teachers.reduce((a, b) => a + b.SumClass, 0)}</Text>
            <Text style={styles.statSub}>Lớp học phần phân công</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TRUNG BÌNH LỚP / GV</Text>
            <Text style={styles.statValue}>{stats?.avgClasses ?? 0}</Text>
            <Text style={styles.statSub}>Chỉ tiêu giảng dạy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>CƠ SỞ DỮ LIỆU</Text>
            <Text style={[styles.statValue, { fontSize: 18, color: '#10B981' }]}>SUPABASE</Text>
            <Text style={styles.statSub}>Bảng: GiangVien (4 fields)</Text>
          </View>
        </View>

        {/* Thanh Công Cụ Nâng Cao (Search, Filter, Export, Add) */}
        <View style={styles.toolbarCard}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Tìm kiếm theo Mã GV (IDGV) hoặc Họ tên..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                void loadData(text);
              }}
            />
            <Pressable style={styles.btnSecondary} onPress={() => void loadData()}>
              <Text style={styles.btnSecondaryText}>↻ Tải lại</Text>
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.sortGroup}>
              <Text style={styles.sortLabel}>Sắp xếp lớp:</Text>
              <Pressable
                style={[styles.sortBtn, sortBy === 'SUMCLASS_DESC' && styles.sortBtnActive]}
                onPress={() => setSortBy(sortBy === 'SUMCLASS_DESC' ? 'NONE' : 'SUMCLASS_DESC')}
              >
                <Text style={styles.sortBtnText}>↓ Giảm dần</Text>
              </Pressable>
              <Pressable
                style={[styles.sortBtn, sortBy === 'SUMCLASS_ASC' && styles.sortBtnActive]}
                onPress={() => setSortBy(sortBy === 'SUMCLASS_ASC' ? 'NONE' : 'SUMCLASS_ASC')}
              >
                <Text style={styles.sortBtnText}>↑ Tăng dần</Text>
              </Pressable>
            </View>

            <View style={styles.rightActions}>
              <Pressable style={styles.exportBtn} onPress={handleExportDatabase}>
                <Text style={styles.exportBtnText}>📥 Xuất File CSDL JSON</Text>
              </Pressable>
              <Pressable style={styles.primaryBtnSmall} onPress={openCreateModal}>
                <Text style={styles.primaryBtnSmallText}>+ Thêm Giảng Viên</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Danh Sách Giảng Viên (Responsive Web & Mobile Card) */}
        <View style={styles.listContainer}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Danh Sách Giảng Viên Học Phần ({displayTeachers.length})</Text>
            <Text style={styles.ruleBadge}>Chuẩn CSDL: IDGV, Fullname, Image, SumClass</Text>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={styles.loadingText}>Đang tải danh sách giảng viên...</Text>
            </View>
          ) : displayTeachers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Chưa có giảng viên nào</Text>
              <Text style={styles.emptySub}>Bấm "+ Thêm Giảng Viên" để thêm mới vào CSDL QLHocPhan</Text>
            </View>
          ) : (
            <View style={styles.cardGrid}>
              {displayTeachers.map((teacher) => (
                <View key={teacher.IDGV} style={styles.teacherCard}>
                  <View style={styles.cardTopRow}>
                    <Image source={{ uri: teacher.Image }} style={styles.teacherAvatar} />
                    <View style={styles.teacherInfo}>
                      <View style={styles.idgvBadge}>
                        <Text style={styles.idgvText}>{teacher.IDGV}</Text>
                      </View>
                      <Text style={styles.teacherName} numberOfLines={1}>{teacher.Fullname}</Text>
                      <View style={styles.sumClassBadge}>
                        <Text style={styles.sumClassText}>📚 {teacher.SumClass} Lớp học phần</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardActionsRow}>
                    <Pressable style={styles.editBtn} onPress={() => openEditModal(teacher)}>
                      <Text style={styles.editBtnText}>✏️ Sửa</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => setDeletingItem(teacher)}>
                      <Text style={styles.deleteBtnText}>🗑 Xóa</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL THÊM / SỬA GIẢNG VIÊN (CHUẨN SHADCN MODAL) */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Cập Nhật Giảng Viên' : 'Thêm Giảng Viên Vào CSDL'}
              </Text>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Cơ sở dữ liệu QLHocPhan gồm đúng 4 trường: IDGV, Fullname, Image, SumClass
            </Text>

            <ScrollView style={styles.modalBody}>
              {/* Mã Giảng viên (IDGV) */}
              <Text style={styles.fieldLabel}>1. Mã Giảng Viên (IDGV) *</Text>
              <TextInput
                style={[styles.input, editingId ? styles.inputDisabled : null]}
                value={formIDGV}
                onChangeText={setFormIDGV}
                editable={!editingId}
                placeholder="VD: GV001"
                placeholderTextColor="#64748B"
              />

              {/* Họ và tên (Fullname) */}
              <Text style={styles.fieldLabel}>2. Họ và tên Giảng Viên (Fullname) *</Text>
              <TextInput
                style={styles.input}
                value={formFullname}
                onChangeText={setFormFullname}
                placeholder="VD: TS. Nguyễn Văn An"
                placeholderTextColor="#64748B"
              />

              {/* Hình ảnh (Image) - URL & Chọn mẫu ảnh trực quan */}
              <Text style={styles.fieldLabel}>3. Hình ảnh đại diện (Image URL) *</Text>
              <View style={styles.imageInputRow}>
                <Image source={{ uri: formImage }} style={styles.previewImage} />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 10 }]}
                  value={formImage}
                  onChangeText={setFormImage}
                  placeholder="https://..."
                  placeholderTextColor="#64748B"
                />
              </View>

              <Text style={styles.subFieldLabel}>Hoặc chọn nhanh avatar mẫu có sẵn:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPickerRow}>
                {SAMPLE_AVATARS.map((url, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setFormImage(url)}
                    style={[styles.avatarChoice, formImage === url && styles.avatarChoiceSelected]}
                  >
                    <Image source={{ uri: url }} style={styles.choiceThumb} />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Tổng số lớp (SumClass) */}
              <Text style={styles.fieldLabel}>4. Tổng số lớp phụ trách (SumClass) *</Text>
              <TextInput
                style={styles.input}
                value={formSumClass}
                onChangeText={setFormSumClass}
                keyboardType="numeric"
                placeholder="VD: 5"
                placeholderTextColor="#64748B"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.btnSecondary} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.btnSecondaryText}>Hủy bỏ</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtnSmall, formSubmitting && styles.btnDisabled]}
                onPress={handleSaveForm}
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnSmallText}>
                    {editingId ? 'Cập Nhật' : 'Lưu Vào CSDL'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal visible={Boolean(deletingItem)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440 }]}>
            <Text style={styles.modalTitle}>Xác Nhận Xóa Giảng Viên?</Text>
            <Text style={styles.modalSubtitle}>
              Hành động này sẽ xóa hoàn toàn giảng viên <Text style={styles.boldText}>{deletingItem?.Fullname}</Text> (Mã: <Text style={styles.boldText}>{deletingItem?.IDGV}</Text>) khỏi CSDL QLHocPhan.
            </Text>
            <View style={styles.modalFooter}>
              <Pressable style={styles.btnSecondary} onPress={() => setDeletingItem(null)}>
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.deleteConfirmBtn} onPress={handleConfirmDelete}>
                <Text style={styles.deleteConfirmBtnText}>Xóa Vĩnh Viễn</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  authBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 12,
  },
  authBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  authTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  authSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  subFieldLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  authFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  authHint: {
    color: '#64748B',
    fontSize: 12,
  },
  boldText: {
    color: '#F1F5F9',
    fontWeight: '700',
  },

  // Main Dashboard Styles
  mainContainer: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  toastContainer: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  toastError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoBox: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandLogoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  navTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  adminTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  adminTagText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  navSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
  desktopOnly: {
    display: 'flex',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  userRole: {
    color: '#64748B',
    fontSize: 11,
  },
  logoutBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  statSub: {
    color: '#94A3B8',
    fontSize: 11,
  },

  // Toolbar
  toolbarCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  btnSecondary: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  sortBtn: {
    backgroundColor: '#0B1120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sortBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  sortBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  exportBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtnSmall: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Danh Sách
  listContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  listTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  ruleBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardGrid: {
    gap: 12,
  },
  teacherCard: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
  },
  teacherInfo: {
    flex: 1,
    gap: 4,
  },
  idgvBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  idgvText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  teacherName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  sumClassBadge: {
    alignSelf: 'flex-start',
  },
  sumClassText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  editBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  modalBody: {
    maxHeight: 420,
  },
  imageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  avatarPickerRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  avatarChoice: {
    padding: 2,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarChoiceSelected: {
    borderColor: '#38BDF8',
  },
  choiceThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 14,
  },
  deleteConfirmBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
