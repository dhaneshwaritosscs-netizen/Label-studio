# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e6]:
    - img "TOAI Studio" [ref=e7]
    - heading "TOAI Studio" [level=1] [ref=e8]
  - generic [ref=e9]:
    - link "LOGIN" [ref=e10] [cursor=pointer]:
      - /url: /user/login/
    - link "SIGN UP" [ref=e11] [cursor=pointer]:
      - /url: /user/signup/
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]: Email/Username
      - generic [ref=e16]:
        - textbox "Email/Username" [ref=e17]: dhaneshwari.tosscss@gmail.com
        - generic [ref=e18]: 🔒
    - generic [ref=e19]:
      - generic [ref=e20]: Password
      - generic [ref=e21]:
        - textbox "Password" [active] [ref=e22]: 123456rakhi
        - generic [ref=e23]: 🔒
    - generic [ref=e24]:
      - generic [ref=e25]:
        - checkbox "Keep me logged in this browser" [checked] [ref=e26] [cursor=pointer]: ✓
        - generic [ref=e27] [cursor=pointer]: Keep me logged in this browser
      - link "Forget Password?" [ref=e28]:
        - /url: "#"
    - button "LOGIN" [ref=e29] [cursor=pointer]
```