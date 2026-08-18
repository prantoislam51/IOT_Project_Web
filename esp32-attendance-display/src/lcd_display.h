#ifndef LCD_DISPLAY_H
#define LCD_DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"

/**
 * 16x2 LCD helpers: centering, padding, truncation and scrolling.
 * The LCD has exactly 16 columns x 2 rows — never assume more.
 */
class LcdDisplay {
public:
    void begin() {
        Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
        lcd_.init();
        lcd_.backlight();
        clear();
    }

    void clear() {
        lcd_.clear();
        cursorRow_ = 0;
    }

    void off() { lcd_.noBacklight(); }
    void on() { lcd_.backlight(); }

    /** Write a line, centered and padded to the full 16-char width. */
    void printCentered(uint8_t row, const String& text) {
        padCenter_(text).toCharArray(buf_, LCD_COLUMNS + 1);
        lcd_.setCursor(0, row);
        lcd_.print(buf_);
    }

    /** Write a line, left aligned, padded to erase leftovers. */
    void printLine(uint8_t row, const String& text) {
        padRight_(text).toCharArray(buf_, LCD_COLUMNS + 1);
        lcd_.setCursor(0, row);
        lcd_.print(buf_);
    }

    /**
     * Show two lines centered (used for state screens).
     * Both lines scroll if longer than 16 chars.
     */
    void showScreen(const String& line1, const String& line2) {
        scroll1_ = line1.length() > LCD_COLUMNS;
        scroll2_ = line2.length() > LCD_COLUMNS;
        text1_ = line1;
        text2_ = line2;
        scrollOffset_ = 0;
        lastScrollMs_ = 0;
        renderScrollFrame_(true);
    }

    /**
     * Show "name / status". Long names scroll horizontally every 400ms.
     * Call service() in the loop while this screen is active.
     */
    void showStudent(const String& name, const String& status) {
        showScreen(name, status);
    }

    /** Animate scrolling; call frequently while a screen is displayed. */
    void service() {
        if (!scroll1_ && !scroll2_) return;
        unsigned long now = millis();
        if (now - lastScrollMs_ < 400) return;
        lastScrollMs_ = now;
        scrollOffset_++;
        renderScrollFrame_(false);
    }

private:
    LiquidCrystal_I2C lcd_{LCD_ADDRESS, LCD_COLUMNS, LCD_ROWS};
    char buf_[LCD_COLUMNS + 1];
    String text1_, text2_;
    bool scroll1_ = false, scroll2_ = false;
    uint16_t scrollOffset_ = 0;
    unsigned long lastScrollMs_ = 0;

    String padCenter_(const String& text) const {
        if (text.length() >= LCD_COLUMNS) return text.substring(0, LCD_COLUMNS);
        int pad = (LCD_COLUMNS - text.length()) / 2;
        String out;
        for (int i = 0; i < pad; i++) out += ' ';
        out += text;
        while (out.length() < LCD_COLUMNS) out += ' ';
        return out;
    }

    String padRight_(const String& text) const {
        String out = text.substring(0, LCD_COLUMNS);
        while (out.length() < LCD_COLUMNS) out += ' ';
        return out;
    }

    String window_(const String& text, uint16_t offset) const {
        if (text.length() <= LCD_COLUMNS) return padCenter_(text);
        // scroll with a 3-space gap for readability
        String loop = text + "   ";
        uint16_t pos = offset % loop.length();
        String out;
        for (int i = 0; i < LCD_COLUMNS; i++) {
            out += loop[(pos + i) % loop.length()];
        }
        return out;
    }

    void renderScrollFrame_(bool force) {
        (void)force;
        String l1 = window_(text1_, scroll1_ ? scrollOffset_ : 0);
        String l2 = window_(text2_, scroll2_ ? scrollOffset_ : 0);
        l1.toCharArray(buf_, LCD_COLUMNS + 1);
        lcd_.setCursor(0, 0);
        lcd_.print(buf_);
        l2.toCharArray(buf_, LCD_COLUMNS + 1);
        lcd_.setCursor(0, 1);
        lcd_.print(buf_);
    }
};

#endif // LCD_DISPLAY_H
