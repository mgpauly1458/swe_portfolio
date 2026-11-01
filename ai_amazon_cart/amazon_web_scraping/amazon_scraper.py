import requests
import bs4
import uncurl
from web_scraping import Request

class AmazonProduct:
    def __init__(self, title:str='', image_url:str='', price:float=0.0):
        self.title = title
        self.image_url = image_url
        self.price = price

    def save_product(self):
        # get first word from title
        first_word = self.title.split()[0]
        self.save_image_from_url(self.image_url, file_name=f"{first_word}.jpg")

    def save_image_from_url(self, image_url:str, file_name:str='product_image.jpg'):
        response = requests.get(image_url)
        if response.status_code == 200:
            with open(file_name, 'wb') as f:
                f.write(response.content)
        else:
            raise ValueError(f"Failed to download image from {image_url}")

class AmazonHTMLParser:
    def __init__(self):
        pass

    def get_product_tags(self, html_content:str) -> list[bs4.Tag]:
        soup = bs4.BeautifulSoup(html_content, 'html.parser')
        search_results = soup.find_all('div', {'data-component-type': 's-search-result'})
        if not search_results:
            raise ValueError("No search results found in the HTML content")
        return self.remove_sponsored_product_tags(search_results)

    def get_product_image_from_product_tag(self, product_tag:bs4.Tag) -> str:
        image_tag = product_tag.find('img', {'class': 's-image'})
        if image_tag:
            return image_tag.get('src')
        raise ValueError("Image tag not found in product tag")

    def get_product_title_from_product_tag(self, product_tag:bs4.Tag) -> str:
        # need to go into this tag tag.div.div.div.span.div.div
        # finad all h2 tags
        title_tag = product_tag.find('h2')
        # get span tag inside h2
        if title_tag:
            span_tag = title_tag.find('span')
            if span_tag:
                return span_tag.text
        raise ValueError("Title tag not found in product tag")
    
    def remove_sponsored_product_tags(self, product_tags:list[bs4.Tag]) -> list[bs4.Tag]:
        non_sponsored_tags = []
        for tag in product_tags:
            sponsored_badge = tag.find('span', string='Sponsored')
            if not sponsored_badge:
                non_sponsored_tags.append(tag)
        return non_sponsored_tags

    def get_product_price_from_product_tag(self, product_tag:bs4.Tag) -> float:
        # get span with class a-price
        whole = product_tag.find('span', {'class': 'a-price-whole'})
        fraction = product_tag.find('span', {'class': 'a-price-fraction'})
        if whole and fraction:
            ## whole.text includes the decimal point in nested span tag
            return float(whole.text + fraction.text)
        raise ValueError("Price tag not found in product tag")

class AmazonWebDriver:
    def __init__(self, curl_command:str):
        self.context = uncurl.parse_context(curl_command)
        self.request = requests.request(url=self.context.url, method=self.context.method, headers=self.context.headers, data=self.context.data)

    def search_for_product(self, search_term:str) -> list[AmazonProduct]:
        search_url = f"{self.context.url}&k={search_term.replace(' ', '+')}"
        response = requests.get(search_url, headers=self.context.headers)
        parser = AmazonHTMLParser()
        search_results = parser.get_product_tags(response.text)
        products = []

        for result in search_results:
            product = AmazonProduct()
            image_tag = parser.get_product_image_from_product_tag(result)
            title_tag = parser.get_product_title_from_product_tag(result)
            product.image_url = image_tag
            product.title = title_tag
            products.append(product)

        return products        