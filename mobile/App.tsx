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
import { getActiveApiBaseUrl } from './src/lib/api-client';

// ============================================================================
// BỘ ICON VECTOR CHUẨN SHADCN / LUCIDE (SVG-STYLE MINIMALIST ICONS)
// ============================================================================
const IconSearch = () => <Text style={styles.svgIcon}>⌕</Text>;
const IconPlus = () => <Text style={styles.svgIcon}>+</Text>;
const IconEdit = () => <Text style={styles.svgIcon}>✎</Text>;
const IconTrash = () => <Text style={styles.svgIcon}>✕</Text>;
const IconRefresh = () => <Text style={styles.svgIcon}>↻</Text>;
const IconDownload = () => <Text style={styles.svgIcon}>↓</Text>;
const IconCheck = () => <Text style={styles.svgIcon}>✓</Text>;
const IconSort = () => <Text style={styles.svgIcon}>⇅</Text>;
const IconDatabase = () => <Text style={styles.svgIcon}>⛁</Text>;
const IconUsers = () => <Text style={styles.svgIcon}>👥</Text>;
const IconBook = () => <Text style={styles.svgIcon}>📖</Text>;

// Danh sách ảnh mẫu avatar giảng viên độ phân giải cao, phong thái học thuật nghiêm túc
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

  // Banner thông báo thanh lịch
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
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
      showToast('success', `Đăng nhập thành công: ${res.user.displayName}`);
    } catch (err: any) {
      setAuthError(err.message || 'Tài khoản hoặc mật khẩu không chính xác');
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
      showToast('error', 'Mã Giảng viên (IDGV) bắt buộc');
      return;
    }
    if (!formFullname.trim()) {
      showToast('error', 'Họ và tên (Fullname) bắt buộc');
      return;
    }
    const numClass = parseInt(formSumClass, 10);
    if (isNaN(numClass) || numClass < 0) {
      showToast('error', 'Tổng số lớp (SumClass) phải là số >= 0');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateGiangVien(editingId, {
          Fullname: formFullname.trim(),
          Image: formImage.trim(),
          SumClass: numClass,
        });
        setTeachers((prev) => prev.map((item) => (item.IDGV === editingId ? updated : item)));
        showToast('success', `Đã cập nhật giảng viên ${updated.IDGV}`);
      } else {
        const created = await createGiangVien({
          IDGV: formIDGV.trim().toUpperCase(),
          Fullname: formFullname.trim(),
          Image: formImage.trim(),
          SumClass: numClass,
        });
        setTeachers((prev) => [created, ...prev]);
        showToast('success', `Đã thêm giảng viên ${created.Fullname}`);
      }
      setIsModalOpen(false);
      void loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi lưu thông tin');
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
      showToast('success', `Đã xóa giảng viên ${deletingItem.IDGV}`);
      setDeletingItem(null);
      void loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi xóa');
    }
  };

  // Xuất file CSDL JSON nộp bài
  const handleExportDatabase = () => {
    if (Platform.OS === 'web') {
      window.open(`${getActiveApiBaseUrl()}/giangvien/export`, '_blank');
      showToast('success', 'Đang tải file CSDL QLHocPhan_GiangVien.json...');
    } else {
      showToast('success', 'File CSDL có sẵn tại root: QLHocPhan_GiangVien.json');
    }
  };

  // Sắp xếp danh sách
  const displayTeachers = [...teachers].sort((a, b) => {
    if (sortBy === 'SUMCLASS_DESC') return b.SumClass - a.SumClass;
    if (sortBy === 'SUMCLASS_ASC') return a.SumClass - b.SumClass;
    return a.IDGV.localeCompare(b.IDGV);
  });

  // ============================================================================
  // MÀN HÌNH 1: ĐĂNG NHẬP ADMIN (TỐI GIẢN, ENTERPRISE CLEAN)
  // ============================================================================
  if (!adminUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="light" />
        <View style={styles.authCard}>
          <View style={styles.authHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>QLHOCPHAN</Text>
            </View>
            <Text style={styles.authTitle}>Đăng Nhập Phân Hệ Admin</Text>
            <Text style={styles.authSubtitle}>
              Cơ sở dữ liệu Học Phần chứa collection Giảng Viên (IDGV, Fullname, Image, SumClass)
            </Text>
          </View>

          {Boolean(authError) && (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{authError}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              placeholderTextColor="#71717a"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#71717a"
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.primaryButton, authLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#09090b" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Đăng Nhập</Text>
            )}
          </Pressable>

          <View style={styles.authFooter}>
            <Text style={styles.authHintText}>
              Tài khoản mặc định: <Text style={styles.boldWhite}>admin</Text> / Mật khẩu: <Text style={styles.boldWhite}>admin123</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // MÀN HÌNH 2: DASHBOARD CHUẨN SHADCN UI / LINEAR CLEAN
  // ============================================================================
  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.dashboardContent}>
        {/* Toast Alert */}
        {toast && (
          <View style={[styles.toastBar, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Text style={styles.toastBarText}>{toast.message}</Text>
          </View>
        )}

        {/* Top Navbar */}
        <View style={styles.navBar}>
          <View style={styles.navLeft}>
            <View style={styles.brandIconBox}>
              <Text style={styles.brandIconText}>HP</Text>
            </View>
            <View>
              <View style={styles.navTitleRow}>
                <Text style={styles.navBrandText}>QLHocPhan</Text>
                <View style={styles.tagAdmin}>
                  <Text style={styles.tagAdminText}>ADMIN</Text>
                </View>
              </View>
              <Text style={styles.navSubText}>Phân hệ quản lý danh sách giảng viên</Text>
            </View>
          </View>

          <View style={styles.navRight}>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{adminUser.displayName}</Text>
              <Text style={styles.adminRole}>admin@danentang</Text>
            </View>
            <Pressable style={styles.outlineButton} onPress={() => setAdminUser(null)}>
              <Text style={styles.outlineButtonText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>

        {/* Thống kê Bento Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>TỔNG GIẢNG VIÊN</Text>
            <Text style={styles.statBoxNumber}>{stats?.totalTeachers ?? teachers.length}</Text>
            <Text style={styles.statBoxDesc}>Bản ghi trong CSDL</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>TỔNG SỐ LỚP</Text>
            <Text style={styles.statBoxNumber}>{stats?.totalClasses ?? teachers.reduce((a, b) => a + b.SumClass, 0)}</Text>
            <Text style={styles.statBoxDesc}>Lớp học phần phụ trách</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>TRUNG BÌNH LỚP</Text>
            <Text style={styles.statBoxNumber}>{stats?.avgClasses ?? 0}</Text>
            <Text style={styles.statBoxDesc}>Lớp / mỗi giảng viên</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>CƠ SỞ DỮ LIỆU</Text>
            <Text style={[styles.statBoxNumber, { fontSize: 16, color: '#e4e4e7' }]}>SUPABASE</Text>
            <Text style={styles.statBoxDesc}>Table: GiangVien (4 fields)</Text>
          </View>
        </View>

        {/* Action Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchField}
              placeholder="Tìm kiếm theo mã GV (IDGV) hoặc Họ tên..."
              placeholderTextColor="#71717a"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                void loadData(text);
              }}
            />
          </View>

          <View style={styles.toolbarButtons}>
            <Pressable
              style={[styles.toolButton, sortBy !== 'NONE' && styles.toolButtonActive]}
              onPress={() => setSortBy(sortBy === 'SUMCLASS_DESC' ? 'NONE' : 'SUMCLASS_DESC')}
            >
              <Text style={styles.toolButtonText}>
                {sortBy === 'SUMCLASS_DESC' ? '↓ Lớp giảm dần' : 'Sắp xếp lớp'}
              </Text>
            </Pressable>

            <Pressable style={styles.toolButton} onPress={() => void loadData()}>
              <Text style={styles.toolButtonText}>Làm mới</Text>
            </Pressable>

            <Pressable style={styles.toolButton} onPress={handleExportDatabase}>
              <Text style={styles.toolButtonText}>Xuất JSON CSDL</Text>
            </Pressable>

            <Pressable style={styles.actionPrimaryButton} onPress={openCreateModal}>
              <Text style={styles.actionPrimaryButtonText}>+ Thêm Giảng Viên</Text>
            </Pressable>
          </View>
        </View>

        {/* Bảng Danh Sách Giảng Viên (Modern Clean Data Table) */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Danh Sách Giảng Viên Học Phần</Text>
            <Text style={styles.tableCardSubtitle}>
              Quy chuẩn 4 trường dữ liệu: IDGV, Fullname, Image, SumClass
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fafafa" size="small" />
              <Text style={styles.loadingMessage}>Đang tải dữ liệu từ CSDL...</Text>
            </View>
          ) : displayTeachers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyHeader}>Không có giảng viên nào</Text>
              <Text style={styles.emptyDescription}>Bấm "+ Thêm Giảng Viên" để nhập bản ghi mới</Text>
            </View>
          ) : (
            <View style={styles.tableBody}>
              {displayTeachers.map((teacher, index) => (
                <View key={teacher.IDGV} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  {/* Avatar & Identity */}
                  <View style={styles.cellAvatar}>
                    <Image source={{ uri: teacher.Image }} style={styles.avatarImg} />
                  </View>

                  <View style={styles.cellMain}>
                    <View style={styles.rowTop}>
                      <View style={styles.badgeIdgv}>
                        <Text style={styles.badgeIdgvText}>{teacher.IDGV}</Text>
                      </View>
                      <Text style={styles.teacherFullName}>{teacher.Fullname}</Text>
                    </View>

                    <View style={styles.rowBottom}>
                      <Text style={styles.classCountText}>
                        Tổng số lớp: <Text style={styles.classCountBold}>{teacher.SumClass}</Text> lớp
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.cellActions}>
                    <Pressable style={styles.btnRowAction} onPress={() => openEditModal(teacher)}>
                      <Text style={styles.btnRowActionText}>Sửa</Text>
                    </Pressable>
                    <Pressable style={styles.btnRowActionDelete} onPress={() => setDeletingItem(teacher)}>
                      <Text style={styles.btnRowActionDeleteText}>Xóa</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL FORM THÊM / SỬA (ENTERPRISE SHADCN DIALOG) */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>
                {editingId ? 'Cập Nhật Giảng Viên' : 'Thêm Giảng Viên Mới'}
              </Text>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <Text style={styles.dialogCloseButton}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.dialogDesc}>
              Bắt buộc đúng 4 trường: IDGV, Fullname, Image, SumClass
            </Text>

            <ScrollView style={styles.dialogBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>1. Mã Giảng Viên (IDGV) *</Text>
                <TextInput
                  style={[styles.input, editingId ? styles.inputReadOnly : null]}
                  value={formIDGV}
                  onChangeText={setFormIDGV}
                  editable={!editingId}
                  placeholder="GV001"
                  placeholderTextColor="#71717a"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>2. Họ và tên Giảng Viên (Fullname) *</Text>
                <TextInput
                  style={styles.input}
                  value={formFullname}
                  onChangeText={setFormFullname}
                  placeholder="TS. Nguyễn Văn An"
                  placeholderTextColor="#71717a"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>3. Link hình ảnh (Image URL) *</Text>
                <View style={styles.imageInputWrap}>
                  <Image source={{ uri: formImage }} style={styles.avatarPreview} />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 12 }]}
                    value={formImage}
                    onChangeText={setFormImage}
                    placeholder="https://..."
                    placeholderTextColor="#71717a"
                  />
                </View>

                <Text style={styles.subLabel}>Hoặc nhấp chọn avatar mẫu:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPickerList}>
                  {SAMPLE_AVATARS.map((url, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setFormImage(url)}
                      style={[styles.sampleAvatarItem, formImage === url && styles.sampleAvatarActive]}
                    >
                      <Image source={{ uri: url }} style={styles.sampleAvatarImg} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>4. Tổng số lớp phụ trách (SumClass) *</Text>
                <TextInput
                  style={styles.input}
                  value={formSumClass}
                  onChangeText={setFormSumClass}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor="#71717a"
                />
              </View>
            </ScrollView>

            <View style={styles.dialogFooter}>
              <Pressable style={styles.outlineButton} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.outlineButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, formSubmitting && styles.btnDisabled]}
                onPress={handleSaveForm}
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <ActivityIndicator color="#09090b" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {editingId ? 'Cập Nhật' : 'Lưu Bản Ghi'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal visible={Boolean(deletingItem)} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogCard, { maxWidth: 440 }]}>
            <Text style={styles.dialogTitle}>Xác Nhận Xóa Giảng Viên</Text>
            <Text style={styles.dialogDesc}>
              Bản ghi <Text style={styles.boldWhite}>{deletingItem?.Fullname}</Text> ({deletingItem?.IDGV}) sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
            </Text>
            <View style={styles.dialogFooter}>
              <Pressable style={styles.outlineButton} onPress={() => setDeletingItem(null)}>
                <Text style={styles.outlineButtonText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.deleteConfirmButton} onPress={handleConfirmDelete}>
                <Text style={styles.deleteConfirmButtonText}>Xác Nhận Xóa</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Global & Theme Constants (Shadcn Zinc Minimalist)
  svgIcon: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  boldWhite: {
    color: '#fafafa',
    fontWeight: '600',
  },

  // Auth Screen
  authContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 28,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  authHeader: {
    marginBottom: 20,
  },
  logoBadge: {
    backgroundColor: '#27272a',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 12,
  },
  logoBadgeText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  authTitle: {
    color: '#fafafa',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  authSubtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorAlertText: {
    color: '#f87171',
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  subLabel: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#fafafa',
    fontSize: 13,
  },
  inputReadOnly: {
    backgroundColor: '#18181b',
    color: '#71717a',
  },
  primaryButton: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  authFooter: {
    marginTop: 18,
    alignItems: 'center',
  },
  authHintText: {
    color: '#71717a',
    fontSize: 12,
  },

  // Dashboard Layout
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  dashboardContent: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  toastBar: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  toastError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#7f1d1d',
  },
  toastBarText: {
    color: '#fafafa',
    fontSize: 13,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: '#fafafa',
    fontWeight: '700',
    fontSize: 14,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBrandText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tagAdmin: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagAdminText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  navSubText: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminInfo: {
    alignItems: 'flex-end',
  },
  adminName: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '600',
  },
  adminRole: {
    color: '#71717a',
    fontSize: 11,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outlineButtonText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
  },

  // Stats Bento
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statBoxLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statBoxNumber: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  statBoxDesc: {
    color: '#71717a',
    fontSize: 12,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    minWidth: 260,
  },
  searchField: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: '#fafafa',
    fontSize: 13,
  },
  toolbarButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  toolButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  toolButtonActive: {
    backgroundColor: '#3f3f46',
  },
  toolButtonText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
  },
  actionPrimaryButton: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionPrimaryButtonText: {
    color: '#09090b',
    fontSize: 12,
    fontWeight: '600',
  },

  // Table Card
  tableCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  tableCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  tableCardTitle: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
  },
  tableCardSubtitle: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },
  tableBody: {
    padding: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 14,
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  cellAvatar: {
    width: 44,
    height: 44,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27272a',
  },
  cellMain: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeIdgv: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeIdgvText: {
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '700',
  },
  teacherFullName: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
  },
  rowBottom: {
    flexDirection: 'row',
  },
  classCountText: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  classCountBold: {
    color: '#fafafa',
    fontWeight: '700',
  },
  cellActions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnRowAction: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  btnRowActionText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
  },
  btnRowActionDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  btnRowActionDeleteText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingMessage: {
    color: '#71717a',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHeader: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDescription: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },

  // Dialog / Modal
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    color: '#fafafa',
    fontSize: 17,
    fontWeight: '600',
  },
  dialogCloseButton: {
    color: '#71717a',
    fontSize: 16,
    padding: 4,
  },
  dialogDesc: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  dialogBody: {
    maxHeight: 380,
  },
  imageInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272a',
  },
  avatarPickerList: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  sampleAvatarItem: {
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 1,
  },
  sampleAvatarActive: {
    borderColor: '#fafafa',
  },
  sampleAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 14,
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteConfirmButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
