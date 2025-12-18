// webapp/src/frontend/src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;
  const languages = i18n.languages || ['en', 'ja', 'zh']; // Default languages if not available

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <Select
        labelId="language-switcher-label"
        id="language-switcher-select"
        value={currentLanguage}
        onChange={handleLanguageChange}
        variant="outlined"
        sx={{ borderRadius: '8px' }} // Consistent with potential theme styling
      >
        {languages.map((lang) => (
          <MenuItem key={lang} value={lang}>
            {t(`languages.${lang}`)} {/* Assumes translations for language names are in translation.json */}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;