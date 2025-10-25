from django.urls import path
from .views import summary, sales_trends, stock_analysis, inventory_turnover


urlpatterns = [
    path('summary/', summary, name='summary'),
    path('sales-trends/', sales_trends, name='sales_trends'),
    path('stock-analysis/', stock_analysis, name='stock_analysis'),
    path('inventory-turnover/', inventory_turnover, name='inventory_turnover'),
]



