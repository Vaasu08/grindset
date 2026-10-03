## Routes (React Router)
- `/` -> `src/pages/Home.jsx`
- `/grind` -> `src/pages/GrindSession.jsx`
- `/auth` -> `src/pages/Auth.jsx`
- `/summary` -> `src/pages/Summary.jsx`

Full config is handled dynamically inside `AnimatedRoutes` (part of `src/App.jsx`):

```jsx
const AnimatedRoutes = ({ session }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={session ? <Home session={session} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/grind" 
          element={session ? <GrindSession session={session} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/auth" 
          element={!session ? <Auth /> : <Navigate to="/" />} 
        />
        <Route 
          path="/summary" 
          element={session ? <Summary /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </AnimatePresence>
  );
};
```
