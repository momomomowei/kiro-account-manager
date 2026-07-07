import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, Download, Upload, RefreshCcw, RotateCw, X, Sparkles, LayoutGrid, List, FolderCog } from 'lucide-react'
import { useApp } from '../../../hooks/useApp'
import FilterDropdown, { PROVIDER_OPTIONS, STATUS_OPTIONS, SUBSCRIPTION_OPTIONS } from './FilterDropdown'
import { getThemeAccent } from '../KiroConfig/themeAccent'

interface AccountHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onRefreshAll: () => void;
  onManageGroups: () => void;
  autoRefreshing: boolean;
  refreshProgress: { current: number; total: number };
  allGroups?: any[];
  selectedGroup: any;
  onGroupFilter: (group: any) => void;
  allTags?: any[];
  selectedTag: any;
  onTagFilter: (tag: any) => void;
  selectedStatus: any;
  onStatusFilter: (status: any) => void;
  sortBy?: string;
  onSortChange: (sort: string) => void;
  viewMode?: string;
  onViewModeChange: (mode: string) => void;
  advancedFilters?: any;
  onAdvancedFiltersChange: (filters: any) => void;
  totalCount?: number;
  onSelectAll: (checked?: boolean) => void;
}

/**
 * 紧凑工具按钮：32x32，统一图标按钮样式。
 * 选中态用 accent 实色渐变，普通态用 glass-card border。
 */
interface IconButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  ariaLabel?: string;
  accent: any;
  badge?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function IconButton({ onClick, active, disabled, title, ariaLabel, accent, badge, className = '', children }: IconButtonProps) {
  const base = 'relative h-8 w-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2'
  const variant = active
    ? `${accent.solidBg} text-white shadow-sm`
    : 'glass-card border border-border hover:bg-muted/50 text-muted-foreground'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`${base} ${variant} ${accent.ring} ${className}`}
    >
      {children}
      {badge}
    </button>
  )
}

interface TopFilterSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  accent: any;
  className?: string;
}

function TopFilterSelect({ label, value, options, onChange, accent, className = 'w-[108px]' }: TopFilterSelectProps) {
  const active = value !== ''
  return (
    <label
      className={`h-8 rounded-md border inline-flex items-center px-2 transition-colors ${
        active
          ? `${accent.border} ${accent.bgSoft}`
          : 'glass-card border-border hover:bg-muted/50'
      }`}
      title={label}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} h-6 bg-transparent text-xs text-foreground outline-none cursor-pointer`}
        aria-label={label}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function AccountHeader({
  searchTerm,
  onSearchChange,
  selectedCount,
  onImport,
  onExport,
  onRefresh,
  onRefreshAll,
  onManageGroups,
  autoRefreshing,
  refreshProgress,
  allGroups = [],
  selectedGroup,
  onGroupFilter,
  allTags = [],
  selectedTag,
  onTagFilter,
  selectedStatus,
  onStatusFilter,
  sortBy = 'default',
  onSortChange,
  viewMode = 'card',
  onViewModeChange,
  advancedFilters = {},
  onAdvancedFiltersChange,
  totalCount = 0,
  onSelectAll,
}: AccountHeaderProps) {
  const { t, theme } = useApp()
  const accent = useMemo(() => getThemeAccent(theme), [theme])

  const [searchExpanded, setSearchExpanded] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 搜索防抖
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchTerm(value)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => onSearchChange(value), 300)
  }, [onSearchChange])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // 点击外部关闭搜索框
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchExpanded && searchRef.current && !searchRef.current.contains(e.target as Node) && !localSearchTerm) {
        setSearchExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [localSearchTerm, searchExpanded])

  // const sortOptions = [
  //   { key: 'usage', label: t('sort.usage'), icon: TrendingUp },
  //   { key: 'added', label: t('sort.added'), icon: Clock },
  //   { key: 'trial', label: t('sort.trial'), icon: Calendar },
  // ]

  const isBatchMode = selectedCount > 0
  const groupOptions = useMemo(() => [
    { value: '', label: '全部分组' },
    { value: '__has__', label: t('groups.hasGroup') || '有分组' },
    { value: '__none__', label: t('groups.noGroup') || '无分组' },
    ...allGroups.map(group => ({
      value: group.id,
      label: group.name || group.id,
    })),
  ], [allGroups, t])
  const subscriptionValue = advancedFilters.subscriptions?.[0] || ''
  const statusValue = advancedFilters.statuses?.[0] || ''
  const providerValue = advancedFilters.providers?.[0] || ''
  const hasTopDropdownFilters = !!(subscriptionValue || statusValue || providerValue || selectedGroup)
  const clearTopDropdownFilters = useCallback(() => {
    onAdvancedFiltersChange({
      ...advancedFilters,
      subscriptions: [],
      statuses: [],
      providers: [],
    })
    onGroupFilter(null)
  }, [advancedFilters, onAdvancedFiltersChange, onGroupFilter])

  return (
    <div className="border-b border-border bg-card/30 backdrop-blur-sm px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* 左侧：标题 / 选中提示 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent.gradientFrom} ${accent.gradientTo} flex items-center justify-center shadow-md ring-1 ring-primary/20 flex-shrink-0`}>
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            {isBatchMode ? (
              <>
                <h1 className="text-sm font-semibold text-foreground leading-tight">
                  {t('common.selected')} {selectedCount} {t('accounts.title')}
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight">{t('accounts.batchOperationMode')}</p>
              </>
            ) : (
              <>
                <h1 className="text-sm font-semibold text-foreground leading-tight truncate">{t('accounts.title')}</h1>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">{t('accounts.subtitle')}</p>
              </>
            )}
          </div>
        </div>

        {/* 右侧：搜索 + 操作 */}
        <div className="flex items-center gap-1.5 flex-shrink-0 justify-end whitespace-nowrap">
          {/* 搜索框 - 可收缩 */}
          <div ref={searchRef} className="relative">
            {searchExpanded || localSearchTerm ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                <input
                  type="text"
                  placeholder={t('accounts.search')}
                  value={localSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                  className={`pl-8 pr-8 h-8 bg-muted/40 border border-transparent rounded-md text-xs w-44 focus:outline-none focus:ring-2 ${accent.ring} text-foreground transition-all`}
                />
                {localSearchTerm && (
                  <button
                    onClick={() => {
                      setLocalSearchTerm('')
                      onSearchChange('')
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                    title={t('settings.clear')}
                  >
                    <X size={12} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            ) : (
              <IconButton
                onClick={() => setSearchExpanded(true)}
                title={t('accounts.search')}
                accent={accent}
              >
                <Search size={14} />
              </IconButton>
            )}
          </div>

          {/* 排序按钮组 */}
          {/*
          <div className="flex gap-1 border border-border rounded-md p-0.5 bg-card/40">
            {sortOptions.map(({ key, label, icon: Icon }) => {
              const isActive = sortBy.startsWith(key)
              const isDesc = sortBy.endsWith('Desc')
              return (
                <IconButton
                  key={key}
                  onClick={() => {
                    if (isActive) {
                      onSortChange(isDesc ? `${key}Asc` : 'default')
                    } else {
                      onSortChange(`${key}Desc`)
                    }
                  }}
                  active={isActive}
                  title={label}
                  accent={accent}
                  className="h-7 w-7 border-0"
                  badge={isActive && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-background shadow flex items-center justify-center ring-1 ring-border">
                      {isDesc ? <ArrowDown size={9} className="text-foreground" /> : <ArrowUp size={9} className="text-foreground" />}
                    </div>
                  )}
                >
                  <Icon size={13} />
                </IconButton>
              )
            })}
          </div>
          */}

          {/* 常用筛选 */}
          <div className="flex items-center gap-1">
            <TopFilterSelect
              label="订阅"
              value={subscriptionValue}
              options={SUBSCRIPTION_OPTIONS}
              onChange={(value) => onAdvancedFiltersChange({ ...advancedFilters, subscriptions: value ? [value] : [] })}
              accent={accent}
            />
            <TopFilterSelect
              label="状态"
              value={statusValue}
              options={STATUS_OPTIONS}
              onChange={(value) => onAdvancedFiltersChange({ ...advancedFilters, statuses: value ? [value] : [] })}
              accent={accent}
              className="w-[86px]"
            />
            <TopFilterSelect
              label="类型"
              value={providerValue}
              options={PROVIDER_OPTIONS}
              onChange={(value) => onAdvancedFiltersChange({ ...advancedFilters, providers: value ? [value] : [] })}
              accent={accent}
              className="w-[96px]"
            />
            <TopFilterSelect
              label="分组"
              value={selectedGroup || ''}
              options={groupOptions}
              onChange={(value) => onGroupFilter(value || null)}
              accent={accent}
              className="w-[112px]"
            />
            <IconButton
              onClick={clearTopDropdownFilters}
              disabled={!hasTopDropdownFilters}
              title="清除下拉筛选"
              accent={accent}
            >
              <X size={14} className={hasTopDropdownFilters ? accent.text : ''} />
            </IconButton>
          </div>

          {/* 视图切换 */}
          <div className="flex gap-0.5 border border-border rounded-md p-0.5 bg-card/40">
            <IconButton
              onClick={() => onViewModeChange('card')}
              active={viewMode === 'card'}
              title={t('accounts.cardView')}
              accent={accent}
              className="h-7 w-7 border-0"
            >
              <LayoutGrid size={13} />
            </IconButton>
            <IconButton
              onClick={() => onViewModeChange('table')}
              active={viewMode === 'table'}
              title={t('accounts.tableView')}
              accent={accent}
              className="h-7 w-7 border-0"
            >
              <List size={13} />
            </IconButton>
          </div>

          {/* 筛选面板 */}
          <FilterDropdown
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
            allGroups={allGroups}
            selectedGroup={selectedGroup}
            onGroupFilter={onGroupFilter}
            allTags={allTags}
            selectedTag={selectedTag}
            onTagFilter={onTagFilter}
            selectedStatus={selectedStatus}
            onStatusFilter={onStatusFilter}
            defaultGroupCollapsed={true}
          />
          <IconButton onClick={onManageGroups} title="分组管理" accent={accent}>
            <FolderCog size={14} className={accent.text} />
          </IconButton>

          {/* 通用操作按钮组 */}
          <div className="flex gap-1 ml-1">
            <IconButton onClick={onImport} title={t('accounts.import')} accent={accent}>
              <Upload size={14} className={accent.text} />
            </IconButton>
            <IconButton onClick={onExport} title={t('accounts.export')} accent={accent}>
              <Download size={14} className={accent.text} />
            </IconButton>
            <IconButton onClick={onRefresh} title={t('accounts.refreshList')} accent={accent}>
              <RotateCw size={14} />
            </IconButton>
            <IconButton onClick={onRefreshAll} disabled={autoRefreshing} title={t('accounts.refreshAll')} accent={accent}>
              <RefreshCcw size={14} className={`${accent.text} ${autoRefreshing ? 'animate-spin' : ''}`} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* 刷新进度条 */}
      {autoRefreshing && refreshProgress.total > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${accent.gradientFrom} ${accent.gradientTo} rounded-full transition-all`}
              style={{ width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }}
            />
          </div>
          <span className={`text-[11px] font-medium ${accent.text}`}>
            {refreshProgress.current}/{refreshProgress.total}
          </span>
        </div>
      )}
    </div>
  )
}

export default AccountHeader
