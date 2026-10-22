import Fretboard from "./fretboard";
import ThemeToggle from "./components/theme-toggle";
import { useTheme } from "./theme";

const App = () => {
    const [theme, setTheme] = useTheme();

    return (
        <>
            <header className="app-header">
                <div className="app-header-inner">
                    <h1 className="app-title">Fretsketch</h1>
                    <ThemeToggle theme={theme} onChange={setTheme} />
                </div>
            </header>
            <main className="container">
                <Fretboard />
            </main>
        </>
    );
};

export default App;
