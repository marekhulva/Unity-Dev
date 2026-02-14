# Documentation Index

## 📚 Challenge Implementation App Documentation

This folder contains comprehensive documentation for the Challenge Implementation app's architecture, data flow, and development guidelines.

## 📁 Documentation Structure

### [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)
Complete system architecture documentation including:
- Technology stack overview
- Database schema and relationships
- Service layer architecture
- Security and RLS policies
- Scaling considerations
- Deployment guidelines
- Monitoring checklist
- Quick reference guides

### [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md)
Visual flow diagrams for all major system processes:
- User journeys (onboarding, daily actions, reviews)
- Data flow patterns
- State management flows
- Real-time update mechanisms
- Error handling flows
- Performance optimization patterns
- 16 Mermaid diagrams for visualization

### [API_SERVICES.md](./API_SERVICES.md)
Complete API and service layer documentation:
- Service method definitions
- Zustand store structure
- API response formats
- Error handling patterns
- Performance optimizations
- Testing utilities
- Security considerations
- Quick reference for common calls

### [SESSION_NOTES.md](./SESSION_NOTES.md)
Development session notes including:
- Recent bug fixes and solutions
- Consistency calculation implementation
- Database migration history
- Troubleshooting guides

## 🚀 Quick Start for Developers

### New Feature Development
1. Read `DATA_ARCHITECTURE.md` for system overview
2. Check `DATA_FLOW_DIAGRAMS.md` for relevant flows
3. Follow patterns in `API_SERVICES.md` for implementation

### Debugging Issues
1. Check `SESSION_NOTES.md` for similar past issues
2. Review error codes in `API_SERVICES.md`
3. Verify data flow in `DATA_FLOW_DIAGRAMS.md`

### Database Changes
1. Review schema in `DATA_ARCHITECTURE.md`
2. Create migration following examples
3. Update RLS policies as needed
4. Document changes in relevant files

## 📊 Key Metrics & Formulas

### Consistency Calculation
```
Consistency % = (Completed Actions / Expected Actions) × 100
Expected Actions = Actions per Day × Days Since Goal Created
```

### Data Sources
- **Historical Data**: `action_completions` table
- **Current State**: `actions` table
- **User Data**: `profiles` table
- **Social Data**: `posts`, `circles`, `circle_members` tables

## 🔧 Common Commands

```bash
# Start development server
PORT=8050 npx expo start --web --port 8050

# Build for iOS TestFlight
eas build --platform ios --profile preview

# Run database migration
# Execute SQL in Supabase dashboard
```

## 📝 Documentation Maintenance

When making significant changes:
1. Update relevant documentation files
2. Add notes to SESSION_NOTES.md for complex fixes
3. Update this README if new docs are added
4. Keep examples current with codebase

## 🔗 External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

Last Updated: September 23, 2025
Version: 1.0.0