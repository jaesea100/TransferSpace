#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Apr 23 13:46:52 2026

@author: jacksoncollins
"""

def clean_text(txt):
    


class TextModel:
    
    def __init__(self, model_name):
        ''' initalizes variabels'''
        self.name = model_name
        self.words = {}
        self.word_length = {}
        
    def __repr__(self):
        """Return a string representation of the TextModel."""
        
        s = 'text model name: ' + self.name + '\n'
        s += '  number of words: ' + str(len(self.words)) + '\n'
        s += '  number of word lengths: ' + str(len(self.word_length)) + '\n'
        return s
    
    def 
