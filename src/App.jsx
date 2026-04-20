function AppInner() {
  const [theme, setTheme] = useTheme();
  const { firebaseUser, isResolvingAuth, user, login, logout } = useAuth();
  const appData = useAppData(firebaseUser);

  // ✅ Always call hooks unconditionally
  useReminderSystems({
    items: appData.items,
    tasks: appData.tasks,
    logs:  appData.logs,
  });

  // ✅ Stable dependencies — not the whole appData object
  const dashboardData = useMemo(
    () => mapToDashboardData({
      tasks:      appData.tasks,
      items:      appData.items,
      weightLogs: appData.weightLogs,
    }),
    [appData.tasks, appData.items, appData.weightLogs]
  );

  if (isResolvingAuth || appData.loading) {
    return <AppLoader />;
  }

  return (
    <DataProvider value={appData}>
      <Routes>
        <Route path="/login"      element={<Login onLogin={login} />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout
                user={user}
                onLogout={logout}
                theme={theme}
                setTheme={setTheme}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={dashboardElement(dashboardData, user)} />
          {PROTECTED_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element(appData, user)} />
          ))}
        </Route>

        <Route
          path="*"
          element={<Navigate to={firebaseUser ? "/" : "/login"} replace />}
        />
      </Routes>
    </DataProvider>
  );
}
// ─── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </BrowserRouter>
    </NotificationProvider>
  );
}
