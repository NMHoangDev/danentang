import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getSupabaseClient } from './src/config/supabase.client';
import {
  createItem,
  deleteItem,
  getItems,
  ItemPriority,
  ItemStatus,
  SupabaseItem,
  updateItemStatus,
} from './src/features/items/api/items-api';
import {
  getSystemHealth,
  SystemHealthData,
} from './src/features/system-health/api/get-system-health';
import {
  getActiveApiBaseUrl,
  setCustomApiBaseUrl,
} from './src/lib/api-client';

const STATUS_CYCLE: Record<ItemStatus, ItemStatus> = {
  PENDING: 'ACTIVE',
  ACTIVE: 'COMPLETED',
  COMPLETED: 'PENDING',
};

export default function App(): React.JSX.Element {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [items, setItems] = useState<SupabaseItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [priority, setPriority] = useState<ItemPriority>('HIGH');
  const [apiEndpoint, setApiEndpoint] = useState<string>(getActiveApiBaseUrl());

  const supabaseClientInfo = getSupabaseClient();

  const loadDashboard = useCallback(
    async (filterValue = statusFilter) => {
      setLoading(true);
      try {
        const [healthData, itemsData] = await Promise.all([
          getSystemHealth(),
          getItems(filterValue),
        ]);
        setHealth(healthData);
        setItems(itemsData);
      } catch (err) {
        setFeedback({
          type: 'error',
          text:
            err instanceof Error
              ? `Lỗi kết nối Backend: ${err.message}`
              : 'Không thể kết nối tới Backend Server',
        });
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    void loadDashboard(statusFilter);
  }, [loadDashboard, statusFilter]);

  const handleCreateItem = async (): Promise<void> => {
    if (title.trim().length < 2) {
      setFeedback({
        type: 'error',
        text: 'Tiêu đề bản ghi phải có ít nhất 2 ký tự!',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const created = await createItem({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'GENERAL',
        priority,
        status: 'ACTIVE',
      });
      setItems((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setFeedback({
        type: 'success',
        text: `Đã lưu bản ghi "${created.title}" vào Supabase Database!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi tạo bản ghi',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCycleStatus = async (item: SupabaseItem): Promise<void> => {
    const nextStatus = STATUS_CYCLE[item.status];
    try {
      const updated = await updateItemStatus(item.id, nextStatus);
      setItems((prev) =>
        prev.map((curr) => (curr.id === item.id ? updated : curr)),
      );
      setFeedback({
        type: 'success',
        text: `Đã cập nhật trạng thái "${item.title}" -> ${nextStatus}`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái',
      });
    }
  };

  const handleDeleteItem = async (
    id: string,
    itemTitle: string,
  ): Promise<void> => {
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((curr) => curr.id !== id));
      setFeedback({
        type: 'success',
        text: `Đã xóa "${itemTitle}" khỏi Supabase Database`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi xóa bản ghi',
      });
    }
  };

  const handleSwitchEndpoint = (nextUrl: string): void => {
    setCustomApiBaseUrl(nextUrl);
    setApiEndpoint(getActiveApiBaseUrl());
    void loadDashboard(statusFilter);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandTag}>
                REACT NATIVE + SUPABASE POSTGRESQL
              </Text>
              <Text style={styles.headerTitle}>DaNenTang Core System</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                health?.status === 'HEALTHY'
                  ? styles.badgeSuccess
                  : styles.badgeError,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {health?.status === 'HEALTHY' ? '● ONLINE' : '● DISCONNECTED'}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Kiến trúc Clean Architecture kết nối React Native ↔ Express Backend ↔
            Supabase PostgreSQL Database
          </Text>
        </View>

        {/* Feedback Banner */}
        {feedback && (
          <View
            style={[
              styles.feedbackBanner,
              feedback.type === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}
          >
            <Text style={styles.feedbackText}>{feedback.text}</Text>
            <Pressable onPress={() => setFeedback(null)}>
              <Text style={styles.feedbackClose}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Connection Diagnostics Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              ⚡ Trạng Thái Kết Nối Backend & Supabase
            </Text>
            <Pressable
              style={styles.refreshBtn}
              onPress={() => void loadDashboard(statusFilter)}
            >
              <Text style={styles.refreshBtnText}>↻ Đồng bộ</Text>
            </Pressable>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Supabase Project</Text>
              <Text style={styles.metricValueSmall} numberOfLines={1}>
                {health?.supabase.projectUrl || supabaseClientInfo.projectUrl}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Database Engine</Text>
              <Text style={styles.metricValue}>
                {health?.supabase.mode || 'CHECKING...'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Độ trễ (Latency)</Text>
              <Text style={styles.metricValue}>
                {health ? `${health.latencyMs} ms` : '--'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>API Endpoint</Text>
              <Text style={styles.metricValueSmall} numberOfLines={1}>
                {apiEndpoint}
              </Text>
            </View>
          </View>

          {/* Dual-Env Endpoint Quick Switch */}
          <View style={styles.envSwitchRow}>
            <Pressable
              style={[
                styles.envBtn,
                apiEndpoint.includes('localhost') && styles.envBtnActive,
              ]}
              onPress={() =>
                handleSwitchEndpoint('http://localhost:4000/api/v1')
              }
            >
              <Text style={styles.envBtnText}>⚡ Localhost:4000</Text>
            </Pressable>
            <Pressable
              style={[
                styles.envBtn,
                apiEndpoint.includes('10.0.2.2') && styles.envBtnActive,
              ]}
              onPress={() =>
                handleSwitchEndpoint('http://10.0.2.2:4000/api/v1')
              }
            >
              <Text style={styles.envBtnText}>🤖 Android Emulator</Text>
            </Pressable>
          </View>
        </View>

        {/* Create Supabase Record Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            ➕ Thêm Bản Ghi Mới Vào Supabase (Table: items)
          </Text>

          <Text style={styles.inputLabel}>Tiêu đề bản ghi *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên công việc / dữ liệu test..."
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>Mô tả chi tiết</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập nội dung mô tả..."
            placeholderTextColor="#64748B"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.rowGap}>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Phân loại (Category)</Text>
              <TextInput
                style={styles.input}
                placeholder="BACKEND / MOBILE / SUPABASE"
                placeholderTextColor="#64748B"
                value={category}
                onChangeText={setCategory}
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Độ ưu tiên (Priority)</Text>
              <View style={styles.priorityGroup}>
                {(['LOW', 'MEDIUM', 'HIGH'] as ItemPriority[]).map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.priorityChip,
                      priority === level && styles.priorityChipActive,
                    ]}
                    onPress={() => setPriority(level)}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        priority === level && styles.priorityChipTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.primaryBtn, submitting && styles.btnDisabled]}
            onPress={() => void handleCreateItem()}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>
              {submitting
                ? 'Đang ghi vào Supabase...'
                : '🚀 Lưu Vào Supabase Database'}
            </Text>
          </Pressable>
        </View>

        {/* Supabase Items Table List */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              📦 Dữ Liệu Bảng Supabase items ({items.length} bản ghi)
            </Text>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED'].map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.filterTab,
                  statusFilter === tab && styles.filterTabActive,
                ]}
                onPress={() => setStatusFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    statusFilter === tab && styles.filterTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#38BDF8" />
              <Text style={styles.loadingText}>
                Đang tải dữ liệu từ Supabase PostgreSQL...
              </Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Chưa có bản ghi nào trong trạng thái {statusFilter}.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <View style={styles.itemBadges}>
                    <Text style={styles.priorityTag}>{item.priority}</Text>
                    <Text
                      style={[
                        styles.statusTag,
                        item.status === 'COMPLETED'
                          ? styles.statusCompleted
                          : item.status === 'ACTIVE'
                            ? styles.statusActive
                            : styles.statusPending,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle}>{item.title}</Text>
                {Boolean(item.description) && (
                  <Text style={styles.itemDesc}>{item.description}</Text>
                )}

                <View style={styles.itemFooter}>
                  <Text style={styles.itemMeta}>ID: {item.id}</Text>
                  <View style={styles.itemActions}>
                    <Pressable
                      style={styles.actionCycleBtn}
                      onPress={() => void handleCycleStatus(item)}
                    >
                      <Text style={styles.actionCycleText}>
                        ⇄ Đổi trạng thái
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionDeleteBtn}
                      onPress={() => void handleDeleteItem(item.id, item.title)}
                    >
                      <Text style={styles.actionDeleteText}>🗑 Xóa</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  headerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  badgeError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusBadgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  feedbackText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  feedbackClose: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  refreshBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  refreshBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 3,
  },
  metricValue: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  metricValueSmall: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  envSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  envBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  envBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  envBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  flex1: {
    flex: 1,
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityChip: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  priorityChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  priorityChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  priorityChipTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemCategory: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  itemBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityTag: {
    backgroundColor: '#1E293B',
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: '#FFFFFF',
  },
  statusCompleted: {
    backgroundColor: '#059669',
  },
  statusActive: {
    backgroundColor: '#0284C7',
  },
  statusPending: {
    backgroundColor: '#D97706',
  },
  itemTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
  },
  itemMeta: {
    color: '#64748B',
    fontSize: 11,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCycleBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  actionCycleText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  actionDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionDeleteText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
});
